// GitHub設定情報
export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  folderPath: string;
  branch: string;
}

// 送信履歴のエントリ
export interface HistoryEntry {
  id: string;
  fileName: string;
  content: string;
  createdAt: Date;
  githubUrl?: string;
  tag?: string; // 旧タグ名（下位互換性のため残す）
  tags?: {
    primary?: string; // カテゴリタグ
    secondary?: string; // 優先度タグなど
  };
}

// 下書き保存データ
export interface DraftData {
  content: string;
  savedAt: Date;
}

// GitHub API レスポンス
export interface GitHubCreateFileResponse {
  content: {
    sha: string;
    html_url: string;
  };
}

// エラー情報
export interface AppError {
  message: string;
  code?: string;
  retry?: boolean;
}

// アプリケーション設定
export interface AppSettings {
  autoSaveDraft: boolean;
  retryAttempts: number;
  retryDelay: number;
}

// タグ情報
export interface Tag {
  id: string;
  name: string;
  order: number; // 表示順序
  type: 'primary' | 'secondary'; // タグの種類（カテゴリ or 優先度など）
}
