// テスト環境のセットアップ確認用のサンプルテスト

describe('Jest セットアップ確認', () => {
  it('基本的なテストが実行できる', () => {
    expect(1 + 1).toBe(2);
  });

  it('文字列のマッチングが動作する', () => {
    const message = 'fragmenta 画像機能';
    expect(message).toContain('画像');
  });
});
