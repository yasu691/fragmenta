/**
 * ネイティブアプリ版のTokenStore実装
 * expo-secure-storeを使用してセキュアに永続化
 * アプリ再起動後もデータが保持される
 *
 * メモリキャッシュ + SecureStore の2段構成:
 * - get/set/clearは同期的にメモリキャッシュを操作
 * - loadFromSecureStoreで初期化時にSecureStoreから読み込み
 * - 保存は自動的にSecureStoreにも反映
 */

import * as SecureStore from 'expo-secure-store';

type TokenData = {
  token: string;
  owner: string;
  repo: string;
  folderPath: string;
  branch: string;
} | null;

const STORAGE_KEY = 'github_token_data';

// メモリキャッシュ
let tokenData: TokenData = null;

export const TokenStore = {
  /**
   * SecureStoreから初期データを読み込む (アプリ起動時に1回呼ぶ)
   */
  async loadFromSecureStore(): Promise<void> {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        tokenData = JSON.parse(stored) as TokenData;
      }
    } catch (error) {
      console.error('Failed to load token from SecureStore:', error);
    }
  },

  /**
   * トークンデータをセット (同期 + SecureStoreへの非同期保存)
   */
  set(data: TokenData): void {
    tokenData = data;

    // SecureStoreにも非同期で保存
    if (data) {
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data)).catch((error) => {
        console.error('Failed to set token in SecureStore:', error);
      });
    } else {
      SecureStore.deleteItemAsync(STORAGE_KEY).catch((error) => {
        console.error('Failed to delete token from SecureStore:', error);
      });
    }
  },

  /**
   * トークンデータを取得 (同期)
   */
  get(): TokenData {
    return tokenData;
  },

  /**
   * トークンデータをクリア (同期 + SecureStoreからの非同期削除)
   */
  clear(): void {
    tokenData = null;

    // SecureStoreからも非同期で削除
    SecureStore.deleteItemAsync(STORAGE_KEY).catch((error) => {
      console.error('Failed to clear token from SecureStore:', error);
    });
  },

  /**
   * トークンが存在するかチェック (同期)
   */
  hasToken(): boolean {
    return tokenData !== null && tokenData.token !== '';
  }
};
