/**
 * Web版のTokenStore実装
 * sessionStorageを使用してセキュリティを保持
 * タブを閉じるとデータが揮発する
 */

type TokenData = {
  token: string;
  owner: string;
  repo: string;
  folderPath: string;
  branch: string;
} | null;

const STORAGE_KEY = 'github_token_data';

export const TokenStore = {
  /**
   * Web版では不要だが、ネイティブ版との互換性のために提供
   */
  async loadFromSecureStore(): Promise<void> {
    // Web版では何もしない (sessionStorageは同期的にアクセス可能)
  },

  set(data: TokenData): void {
    if (data) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  },

  get(): TokenData {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }
      return JSON.parse(stored) as TokenData;
    } catch (error) {
      console.error('Failed to get token from sessionStorage:', error);
      return null;
    }
  },

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  },

  hasToken(): boolean {
    const data = this.get();
    return data !== null && data.token !== '';
  }
};
