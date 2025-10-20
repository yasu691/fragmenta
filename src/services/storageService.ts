import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { GitHubConfig, HistoryEntry, DraftData, AppSettings } from '../types';

// ストレージキー定数
const KEYS = {
  GITHUB_TOKEN: 'github_token',
  GITHUB_CONFIG: 'github_config',
  DRAFT: 'draft_content',
  HISTORY: 'submission_history',
  SETTINGS: 'app_settings',
} as const;

export class StorageService {
  // ========== GitHub設定関連 ==========

  /**
   * GitHub Personal Access Tokenを安全に保存
   */
  async saveGitHubToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.GITHUB_TOKEN, token);
  }

  /**
   * GitHub Personal Access Tokenを取得
   */
  async getGitHubToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.GITHUB_TOKEN);
  }

  /**
   * GitHub設定を保存 (トークン以外)
   */
  async saveGitHubConfig(config: Omit<GitHubConfig, 'token'>): Promise<void> {
    await AsyncStorage.setItem(KEYS.GITHUB_CONFIG, JSON.stringify(config));
  }

  /**
   * GitHub設定を取得
   */
  async getGitHubConfig(): Promise<GitHubConfig | null> {
    const token = await this.getGitHubToken();
    const configJson = await AsyncStorage.getItem(KEYS.GITHUB_CONFIG);

    if (!token || !configJson) {
      return null;
    }

    const config = JSON.parse(configJson);
    return { ...config, token };
  }

  /**
   * GitHub設定が存在するかチェック
   */
  async hasGitHubConfig(): Promise<boolean> {
    const config = await this.getGitHubConfig();
    return config !== null;
  }

  /**
   * GitHub設定をクリア
   */
  async clearGitHubConfig(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.GITHUB_TOKEN);
    await AsyncStorage.removeItem(KEYS.GITHUB_CONFIG);
  }

  // ========== 下書き保存関連 ==========

  /**
   * 下書きを保存
   */
  async saveDraft(content: string): Promise<void> {
    const draft: DraftData = {
      content,
      savedAt: new Date(),
    };
    await AsyncStorage.setItem(KEYS.DRAFT, JSON.stringify(draft));
  }

  /**
   * 下書きを取得
   */
  async getDraft(): Promise<DraftData | null> {
    const draftJson = await AsyncStorage.getItem(KEYS.DRAFT);
    if (!draftJson) {
      return null;
    }

    const draft = JSON.parse(draftJson);
    // Date型に変換
    draft.savedAt = new Date(draft.savedAt);
    return draft;
  }

  /**
   * 下書きをクリア
   */
  async clearDraft(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.DRAFT);
  }

  // ========== 送信履歴関連 ==========

  /**
   * 送信履歴を追加
   */
  async addHistory(entry: Omit<HistoryEntry, 'id'>): Promise<void> {
    const history = await this.getHistory();
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(), // 簡易的なID生成
    };

    history.unshift(newEntry); // 新しい履歴を先頭に追加

    // 最大100件まで保持
    const trimmedHistory = history.slice(0, 100);

    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(trimmedHistory));
  }

  /**
   * 送信履歴を取得
   */
  async getHistory(): Promise<HistoryEntry[]> {
    const historyJson = await AsyncStorage.getItem(KEYS.HISTORY);
    if (!historyJson) {
      return [];
    }

    const history = JSON.parse(historyJson);
    // Date型に変換
    return history.map((entry: any) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
    }));
  }

  /**
   * 送信履歴をクリア
   */
  async clearHistory(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.HISTORY);
  }

  /**
   * 特定の履歴エントリを削除
   */
  async deleteHistoryEntry(id: string): Promise<void> {
    const history = await this.getHistory();
    const filteredHistory = history.filter((entry) => entry.id !== id);
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(filteredHistory));
  }

  // ========== アプリ設定関連 ==========

  /**
   * アプリ設定を保存
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }

  /**
   * アプリ設定を取得
   */
  async getSettings(): Promise<AppSettings> {
    const settingsJson = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!settingsJson) {
      // デフォルト設定
      return {
        autoSaveDraft: true,
        retryAttempts: 3,
        retryDelay: 1000,
      };
    }

    return JSON.parse(settingsJson);
  }

  // ========== 全データクリア ==========

  /**
   * すべてのデータをクリア (開発・デバッグ用)
   */
  async clearAll(): Promise<void> {
    await this.clearGitHubConfig();
    await this.clearDraft();
    await this.clearHistory();
    await AsyncStorage.removeItem(KEYS.SETTINGS);
  }
}

// シングルトンインスタンス
export const storageService = new StorageService();
