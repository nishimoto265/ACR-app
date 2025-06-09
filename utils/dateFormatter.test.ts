// /media/thithilab/ボリューム1/ACR/ACR-app/utils/dateFormatter.test.ts

import { formatDate, formatDuration } from './dateFormatter'; // テスト対象の関数をインポート

describe('formatDate', () => { // テストスイート: formatDate関数に関するテストをまとめる
  it('should format a Date object to YYYY/MM/DD HH:mm in ja-JP locale', () => {
    // 準備: テスト用の Date オブジェクトを作成
    // 例: 2024年5月1日 15時30分0秒 (月は0から始まるので 4 を指定)
    const testDate = new Date(2024, 4, 1, 15, 30, 0);

    // 実行: formatDate 関数を呼び出す
    const formattedString = formatDate(testDate);

    // アサーション: 期待される出力と比較
    // toLocaleString("ja-JP", ...) の挙動に基づき、期待値を設定
    // 注: 環境によって微妙にフォーマットが異なる可能性も考慮（特にスペース）
    //    より厳密にするなら正規表現なども使える
    expect(formattedString).toBe('2024/05/01 15:30');
  });

  // 他のケースも追加できる (例: 日付が一桁の場合、0時0分の場合など)
  it('should format single digit day and month with leading zeros', () => {
    const testDate = new Date(2024, 0, 5, 8, 5, 0); // 2024年1月5日 08:05
    const formattedString = formatDate(testDate);
    expect(formattedString).toBe('2024/01/05 08:05');
  });
});

// formatDuration 関数のテスト
describe('formatDuration', () => {
  it('should format 0 seconds as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('should format less than a minute correctly', () => {
    expect(formatDuration(30)).toBe('0:30');
  });

  it('should format exactly one minute correctly', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  it('should format more than a minute correctly', () => {
    expect(formatDuration(95)).toBe('1:35'); // 1 minute 35 seconds
  });

  it('should pad single digit seconds with a leading zero', () => {
    expect(formatDuration(65)).toBe('1:05'); // 1 minute 5 seconds
  });

  it('should handle larger numbers correctly', () => {
    expect(formatDuration(615)).toBe('10:15'); // 10 minutes 15 seconds
  });
});
