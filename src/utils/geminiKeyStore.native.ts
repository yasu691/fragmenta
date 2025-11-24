/**
 * ネイティブアプリ版の GeminiKeyStore 実装
 * expo-secure-store を使用してセキュアに永続化
 * アプリ再起動後もデータが保持される (ユーザー要求仕様)
 *
 * メモリキャッシュ + SecureStore の2段構成:
 * - get/set/clear は同期的にメモリキャッシュを操作
 * - loadFromSecureStore で初期化時に SecureStore から読み込み
 * - 保存は自動的に SecureStore にも反映
 */

import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'gemini_api_key';

// メモリキャッシュ
let apiKey: string | null = null;

export const GeminiKeyStore = {
  /**
   * SecureStore から初期データを読み込む (アプリ起動時に1回呼ぶ)
   */
  async loadFromSecureStore(): Promise<void> {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        apiKey = stored;
      }
    } catch (error) {
      console.error('Failed to load Gemini API key from SecureStore:', error);
    }
  },

  /**
   * API キーをセット (同期 + SecureStore への非同期保存)
   */
  set(key: string | null): void {
    apiKey = key;

    // SecureStore にも非同期で保存
    if (key) {
      SecureStore.setItemAsync(STORAGE_KEY, key).catch((error) => {
        console.error('Failed to set Gemini API key in SecureStore:', error);
      });
    } else {
      SecureStore.deleteItemAsync(STORAGE_KEY).catch((error) => {
        console.error('Failed to delete Gemini API key from SecureStore:', error);
      });
    }
  },

  /**
   * API キーを取得 (同期)
   */
  get(): string | null {
    return apiKey;
  },

  /**
   * API キーをクリア (同期 + SecureStore からの非同期削除)
   */
  clear(): void {
    apiKey = null;

    // SecureStore からも非同期で削除
    SecureStore.deleteItemAsync(STORAGE_KEY).catch((error) => {
      console.error('Failed to clear Gemini API key from SecureStore:', error);
    });
  },

  /**
   * API キーが存在するかチェック (同期)
   */
  hasKey(): boolean {
    return apiKey !== null && apiKey !== '';
  }
};
