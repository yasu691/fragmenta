/**
 * Web版の GeminiKeyStore 実装
 * sessionStorage を使用してセキュリティを保持
 * タブを閉じるとデータが揮発する (ユーザー要求仕様)
 */

const STORAGE_KEY = 'gemini_api_key';

export const GeminiKeyStore = {
  /**
   * Web版では不要だが、ネイティブ版との互換性のために提供
   */
  async loadFromSecureStore(): Promise<void> {
    // Web版では何もしない (sessionStorageは同期的にアクセス可能)
  },

  set(apiKey: string | null): void {
    if (apiKey) {
      sessionStorage.setItem(STORAGE_KEY, apiKey);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  },

  get(): string | null {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored;
    } catch (error) {
      console.error('Failed to get Gemini API key from sessionStorage:', error);
      return null;
    }
  },

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  },

  hasKey(): boolean {
    const key = this.get();
    return key !== null && key !== '';
  }
};
