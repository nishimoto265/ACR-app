const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors()); // すべてのオリジンからのアクセスを許可

// Cloud Run APIへのプロキシ設定
app.use('/api', createProxyMiddleware({
  target: 'https://acr-3-148163978225.asia-northeast2.run.app',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // 'api/process_all' を '/process_all' にリライト
  },
  onProxyRes: (proxyRes, req, res) => {
    // レスポンスヘッダーを追加
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
}));

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`プロキシサーバーが http://localhost:${PORT} で起動しました`);
}); 