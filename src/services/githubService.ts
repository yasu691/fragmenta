import { Octokit } from '@octokit/rest';
import { Buffer } from 'buffer';
import { GitHubConfig, GitHubCreateFileResponse, AppError } from '../types';
import { formatDateToFileName } from '../utils/dateFormatter';

export class GitHubService {
  private octokit: Octokit | null = null;
  private config: GitHubConfig | null = null;

  /**
   * GitHub APIクライアントを初期化
   */
  initialize(config: GitHubConfig): void {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token,
    });
  }

  /**
   * 設定が初期化されているかチェック
   */
  private ensureInitialized(): void {
    if (!this.octokit || !this.config) {
      throw new Error('GitHubService is not initialized. Call initialize() first.');
    }
  }

  /**
   * Markdownファイルを作成してGitHubにコミット
   * @param content - Markdownファイルの内容
   * @returns 作成されたファイルのURL
   */
  async createMarkdownFile(content: string): Promise<string> {
    this.ensureInitialized();

    if (!this.config) {
      throw new Error('Configuration is not set');
    }

    const fileName = formatDateToFileName();
    const filePath = this.config.folderPath
      ? `${this.config.folderPath}/${fileName}`
      : fileName;

    try {
      const response = await this.octokit!.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message: `Add markdown file: ${fileName}`,
        content: Buffer.from(content, 'utf-8').toString('base64'),
        branch: this.config.branch,
      });

      return response.data.content?.html_url || '';
    } catch (error: any) {
      // エラーハンドリング
      const appError: AppError = {
        message: error.message || 'Failed to create file on GitHub',
        code: error.status?.toString(),
        retry: error.status >= 500, // 5xxエラーはリトライ可能
      };
      throw appError;
    }
  }

  /**
   * 指定フォルダ内のファイル一覧を取得
   * @returns ファイルパスの配列
   */
  async listFiles(): Promise<string[]> {
    this.ensureInitialized();

    if (!this.config) {
      throw new Error('Configuration is not set');
    }

    try {
      const response = await this.octokit!.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.folderPath || '',
        ref: this.config.branch,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .filter((item) => item.type === 'file' && item.name.endsWith('.md'))
          .map((item) => item.name);
      }

      return [];
    } catch (error: any) {
      if (error.status === 404) {
        // フォルダが存在しない場合は空配列を返す
        return [];
      }

      const appError: AppError = {
        message: error.message || 'Failed to list files from GitHub',
        code: error.status?.toString(),
        retry: error.status >= 500,
      };
      throw appError;
    }
  }

  /**
   * 設定の検証
   * @param config - 検証するGitHub設定
   * @returns 設定が有効かどうか
   */
  async validateConfig(config: GitHubConfig): Promise<boolean> {
    try {
      const tempOctokit = new Octokit({ auth: config.token });

      // リポジトリにアクセスできるか確認
      await tempOctokit.repos.get({
        owner: config.owner,
        repo: config.repo,
      });

      return true;
    } catch (error) {
      return false;
    }
  }
}

// シングルトンインスタンス
export const githubService = new GitHubService();
