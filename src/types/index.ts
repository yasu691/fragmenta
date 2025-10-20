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
