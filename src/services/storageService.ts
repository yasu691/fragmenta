import AsyncStorage from '@react-native-async-storage/async-storage';
import { GitHubConfig, HistoryEntry, DraftData, AppSettings, Tag } from '../types';

// ストレージキー定数
const KEYS = {
  GITHUB_CONFIG: 'github_config',
  DRAFT: 'draft_content',
  HISTORY: 'submission_history',
  SETTINGS: 'app_settings',
  TAGS: 'tags',
} as const;

export class StorageService {
  // ========== GitHub設定関連 ==========

  /**
   * GitHub設定を保存 (トークン以外)
   */
  async saveGitHubConfig(config: Omit<GitHubConfig, 'token'>): Promise<void> {
    await AsyncStorage.setItem(KEYS.GITHUB_CONFIG, JSON.stringify(config));
  }

  /**
   * GitHub設定を取得 (トークン以外)
   */
  async getGitHubConfig(): Promise<Omit<GitHubConfig, 'token'> | null> {
    const configJson = await AsyncStorage.getItem(KEYS.GITHUB_CONFIG);
    if (!configJson) {
      return null;
    }
    return JSON.parse(configJson);
  }

  /**
   * GitHub設定をクリア
   */
  async clearGitHubConfig(): Promise<void> {
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

  // ========== タグ管理関連 ==========

  /**
   * タグ一覧を取得
   * @param type タグタイプでフィルタ（オプション）
   */
  async getTags(type?: 'primary' | 'secondary'): Promise<Tag[]> {
    const tagsJson = await AsyncStorage.getItem(KEYS.TAGS);
    if (!tagsJson) {
      return [];
    }
    const allTags: Tag[] = JSON.parse(tagsJson);

    // タイプ指定がある場合はフィルタリング
    if (type) {
      return allTags.filter(tag => tag.type === type);
    }

    return allTags;
  }

  /**
   * タグ一覧を保存
   */
  async saveTags(tags: Tag[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.TAGS, JSON.stringify(tags));
  }

  /**
   * タグを追加
   * @param name タグ名
   * @param type タグタイプ（primary or secondary）
   */
  async addTag(name: string, type: 'primary' | 'secondary'): Promise<Tag> {
    const allTags = await this.getTags();
    const tagsOfType = allTags.filter(tag => tag.type === type);

    // 同じタイプ内で重複チェック
    if (tagsOfType.some(tag => tag.name === name)) {
      throw new Error('同じ名前のタグが既に存在します');
    }

    const newTag: Tag = {
      id: Date.now().toString(),
      name,
      order: tagsOfType.length, // 同じタイプ内での順序
      type,
    };

    allTags.push(newTag);
    await this.saveTags(allTags);
    return newTag;
  }

  /**
   * タグを削除
   */
  async deleteTag(id: string): Promise<void> {
    const allTags = await this.getTags();
    const deletedTag = allTags.find(tag => tag.id === id);
    if (!deletedTag) return;

    const filteredTags = allTags.filter(tag => tag.id !== id);

    // 削除したタグと同じタイプのタグだけorder を振り直し
    const reorderedTags = filteredTags.map(tag => {
      if (tag.type === deletedTag.type && tag.order > deletedTag.order) {
        return { ...tag, order: tag.order - 1 };
      }
      return tag;
    });

    await this.saveTags(reorderedTags);
  }

  /**
   * タグの並び順を変更
   */
  async reorderTags(tags: Tag[]): Promise<void> {
    // order を振り直し
    const reorderedTags = tags.map((tag, index) => ({
      ...tag,
      order: index,
    }));
    await this.saveTags(reorderedTags);
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
    await AsyncStorage.removeItem(KEYS.TAGS);
  }
}

// シングルトンインスタンス
export const storageService = new StorageService();
