// GitHub設定情報
export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  folderPath: string;
  branch: string;
  geminiApiKey?: string; // Gemini API キー（オプショナル）
}

// 画像データ
export interface ImageData {
  uri: string; // 画像のローカルURI（GitHub保存用・低解像度: 1280px）
  highResUri: string; // 高解像度URI（Gemini分析用: 2400px）
  caption: string; // Gemini が生成したキャプション
  fileName: string; // yyyymmddhhmmss-n.png 形式のファイル名
}

// 投稿時に付与するタグ
export interface SelectedTags {
  primary?: string; // カテゴリタグ
  secondary?: string; // 優先度タグなど
  custom?: string[]; // 自由入力のタグ
}

// 送信履歴のエントリ
export interface HistoryEntry {
  id: string;
  fileName: string;
  content: string;
  createdAt: Date;
  githubUrl?: string;
  tag?: string; // 旧タグ名（下位互換性のため残す）
  tags?: SelectedTags;
  images?: ImageData[]; // 添付画像データ
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
