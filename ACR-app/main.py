#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cube ACR Recordings → Whisper → Firestore & Firebase Storage
Drive の変更をポーリングし、新規音声ファイルをダウンロード → 文字起こし → 日付・電話番号抽出 → LangChain で要約 → Firebase Storage に音声保存 → Firestore にメタデータ保存
"""

import os, io, json, logging, tempfile, uuid, re, subprocess
from datetime import datetime
from pathlib import Path
from typing import Tuple, Any, Dict

from flask import Flask, request, jsonify, abort
from google.cloud import firestore
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import openai

import firebase_admin
from firebase_admin import credentials as fb_credentials, storage as fb_storage

# LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# ──────────────────── 設定 ────────────────────
OPENAI_API_KEY    = os.environ["OPENAI_API_KEY"]
GOOGLE_API_KEY    = os.environ["GOOGLE_API_KEY"]
DRIVE_FOLDER_ID   = os.environ["FOLDER_ID"]
DRIVE_SA_KEY_JSON = json.loads(os.environ["DRIVE_SA_KEY_JSON"])
FIREBASE_SA_KEY   = json.loads(os.environ["FIREBASE_SA_KEY_JSON"])
FIREBASE_BUCKET   = os.environ.get("STORAGE_BUCKET", "nodal-alcove-457508-h6.firebasestorage.app")
FIREBASE_PROJECT_ID = "nodal-alcove-457508-h6"

# Load Firebase SA key into Google credentials format for Firestore client
gcp_creds = service_account.Credentials.from_service_account_info(FIREBASE_SA_KEY)
db = firestore.Client(project=FIREBASE_PROJECT_ID, credentials=gcp_creds)

openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

# Use the same SA key loaded earlier
cred = fb_credentials.Certificate(FIREBASE_SA_KEY)
# Avoid double initialization if script reloads in some environments
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {"storageBucket": FIREBASE_BUCKET})
bucket = fb_storage.bucket() # Use the default app's bucket initialized above

# LangChain 要約チェーン設定
chat_llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash-latest",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.5,
    convert_system_message_to_human=True
)
prompt = PromptTemplate(input_variables=["text"], template="以下の通話内容を日本語で簡潔に要約してください：\n\n{text}")
summarize_chain = LLMChain(llm=chat_llm, prompt=prompt)

# 許可する拡張子
SUPPORTED_EXT = {"flac","m4a","mp3","mp4","mpeg","mpga","oga","ogg","wav","webm","amr"}

# Flask アプリ設定
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)


def get_drive() -> Any:
    """Drive API クライアントを返す"""
    creds = service_account.Credentials.from_service_account_info(
        DRIVE_SA_KEY_JSON,
        scopes=[
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.metadata.readonly",
        ],
    )
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def clean_ext(name: str) -> str:
    return Path(name).suffix.lower().lstrip(" .")


def download_from_drive(file_id: str, name: str) -> Tuple[str, str]:
    """Drive から音声ファイルをダウンロードし、必要なら変換"""
    ext = clean_ext(name)
    if ext not in SUPPORTED_EXT:
        raise ValueError(f"unsupported ext: {ext}")

    drive = get_drive()
    req = drive.files().get_media(fileId=file_id)
    buf = io.BytesIO()
    dl = MediaIoBaseDownload(buf, req)
    done = False
    while not done:
        _, done = dl.next_chunk()

    tempdir = tempfile.mkdtemp()
    original = os.path.join(tempdir, f"{uuid.uuid4()}.{ext}")
    with open(original, "wb") as out_f:
        out_f.write(buf.getvalue())

    if ext == "amr":
        converted = os.path.join(tempdir, f"{uuid.uuid4()}.mp3")
        subprocess.run([
            "ffmpeg", "-i", original, "-acodec", "mp3", "-y", converted
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return converted, "mp3"

    return original, ext


def upload_to_firebase(local_path: str, dest_path: str) -> str:
    """Firebase Storage にアップロードし、公開 URL を返す"""
    blob = bucket.blob(dest_path)
    blob.upload_from_filename(local_path)
    blob.make_public()
    return blob.public_url


def transcription(src_path: str) -> str:
    """Whisper-1 で文字起こし（日本語固定）"""
    with open(src_path, "rb") as f:
        resp = openai_client.audio.transcriptions.create(
            file=f, model="whisper-1", language="ja"
        )
    return resp.text


def summarize(text: str) -> str:
    """LangChain チェーンで要約実行"""
    result = summarize_chain.invoke({"text": text})
    return result.get("text") if isinstance(result, dict) else result


def parse_filename(name: str) -> Tuple[str, datetime]:
    """ファイル名から電話番号と録音日時を抽出"""
    m_phone = re.match(r"^([\d-]+)", name)
    if not m_phone:
        raise ValueError(f"Phone number not found in filename: {name}")
    phone = m_phone.group(1)

    m_date = re.search(r"(\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2})", name)
    if not m_date:
        raise ValueError(f"Datetime not found in filename: {name}")
    recorded_at = datetime.strptime(m_date.group(1), "%Y-%m-%d %H-%M-%S")
    return phone, recorded_at


def enqueue_record(file_id: str, meta: Dict[str, Any]) -> None:
    """Adds or updates a recording document in Firestore using fileId as the document ID."""
    # Remove fileId from meta if it's there, as it's now the document ID
    # meta.pop("fileId", None) # Keep fileId in the data for reference if needed
    # Use set() with the file_id as the document ID. This creates or overwrites.
    db.collection("recordings").document(file_id).set(meta)


@app.post("/poll")
def poll():
    body = request.get_json(force=True, silent=True) or {}
    drive = get_drive()

    meta_ref = db.collection("meta").document("drivePageToken")
    token_doc = meta_ref.get()
    token = body.get("startPageToken") or (token_doc.to_dict() or {}).get("value")
    if not token:
        token = drive.changes().getStartPageToken().execute()["startPageToken"]

    polled = 0
    while True:
        resp = drive.changes().list(
            pageToken=token, spaces="drive",
            fields="nextPageToken,newStartPageToken,changes(file(id,name,mimeType,parents))"
        ).execute()
        for ch in resp.get("changes", []):
            f = ch.get("file") or {}
            if not f.get("mimeType", "").startswith("audio/") or DRIVE_FOLDER_ID not in (f.get("parents") or []):
                continue
            fid, name = f["id"], f["name"]
            try:
                local, ext = download_from_drive(fid, name)
                phone, recorded_at = parse_filename(name)
                dest = f"recordings/{recorded_at.date()}/{uuid.uuid4()}.{ext}"
                audio_url = upload_to_firebase(local, dest)
                text = transcription(local)
                summary = summarize(text)
                # Prepare metadata dictionary
                meta_data = {
                    "fileId": fid, # Keep fileId in the document fields as well
                    "fileName": name,
                    "phoneNumber": phone,
                    "recordedAt": recorded_at,
                    "transcript": text,
                    "summary": summary,
                    "audioUrl": audio_url,
                    "status": "done",
                    "createdAt": firestore.SERVER_TIMESTAMP # Use server timestamp for creation
                }
                # Use fileId (fid) as the document ID
                enqueue_record(fid, meta_data)
                polled += 1
                logging.info("✅ processed/updated: %s (ID: %s)", name, fid)
            except Exception:
                logging.exception("❌ failed: %s", name)
        token = resp.get("newStartPageToken") or resp.get("nextPageToken") or token
        if not resp.get("nextPageToken"): break
    meta_ref.set({"value": token})
    logging.info("polled=%s", polled)
    return jsonify({"polled": polled})


@app.post("/webhook")
def webhook():
    data = request.get_json(force=True)
    fid, name = data["fileId"], data["fileName"]
    logging.info("▶️ start webhook: %s %s", fid, name)
    try:
        local, ext = download_from_drive(fid, name)
        phone, recorded_at = parse_filename(name)
        dest = f"recordings/{recorded_at.date()}/{uuid.uuid4()}.{ext}"
        audio_url = upload_to_firebase(local, dest)
        text = transcription(local)
        summary = summarize(text)
        # Prepare metadata dictionary
        meta_data = {
            "fileId": fid, # Keep fileId in the document fields as well
            "fileName": name,
            "phoneNumber": phone,
            "recordedAt": recorded_at,
            "transcript": text,
            "summary": summary,
            "audioUrl": audio_url,
            "status": "done",
            "createdAt": firestore.SERVER_TIMESTAMP # Use server timestamp for creation
        }
        # Use fileId (fid) as the document ID
        enqueue_record(fid, meta_data)
        logging.info("✅ processed/updated webhook: %s (ID: %s)", name, fid)
        return jsonify({"ok": True})
    except Exception:
        logging.exception("❌ webhook failed")
        abort(500)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")), debug=False)
