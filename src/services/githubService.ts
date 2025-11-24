import { Octokit } from '@octokit/rest';
import { Buffer } from 'buffer';
import { GitHubConfig, GitHubCreateFileResponse, AppError, ImageData } from '../types';
import { formatDateToFileName } from '../utils/dateFormatter';
import * as FileSystem from 'expo-file-system';

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
   * 画像付きMarkdownファイルを作成してGitHubにコミット
   * @param content - Markdownファイルの内容（画像リンクなし）
   * @param images - 画像データの配列
   * @returns 作成されたMarkdownファイルのURL
   */
  async createMarkdownWithImages(content: string, images: ImageData[]): Promise<string> {
    this.ensureInitialized();

    if (!this.config) {
      throw new Error('Configuration is not set');
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const fileName = formatDateToFileName(now);
    const markdownPath = this.config.folderPath
      ? `${this.config.folderPath}/${fileName}`
      : fileName;

    try {
      // 画像リンクを含むMarkdownコンテンツを生成
      let markdownContent = content;

      if (images.length > 0) {
        markdownContent += '\n\n---\n\n';
        for (const image of images) {
          const imagePath = this.config.folderPath
            ? `${this.config.folderPath}/assets/${year}/${month}/${image.fileName}`
            : `assets/${year}/${month}/${image.fileName}`;

          // 相対パスで画像リンクを追加
          const relativeImagePath = `./assets/${year}/${month}/${image.fileName}`;
          markdownContent += `\n![${image.caption}](${relativeImagePath})\n`;
          if (image.caption) {
            markdownContent += `*${image.caption}*\n`;
          }
        }
      }

      // 現在のブランチの最新コミットを取得
      const { data: refData } = await this.octokit!.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${this.config.branch}`,
      });

      const latestCommitSha = refData.object.sha;

      // 最新コミットのツリーを取得
      const { data: commitData } = await this.octokit!.git.getCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        commit_sha: latestCommitSha,
      });

      const baseTreeSha = commitData.tree.sha;

      // 新しいツリーのエントリを作成
      const treeEntries: any[] = [];

      // Markdownファイルを追加
      treeEntries.push({
        path: markdownPath,
        mode: '100644',
        type: 'blob',
        content: markdownContent,
      });

      // 画像ファイルを追加
      for (const image of images) {
        const imagePath = this.config.folderPath
          ? `${this.config.folderPath}/assets/${year}/${month}/${image.fileName}`
          : `assets/${year}/${month}/${image.fileName}`;

        console.log('[GitHub] 画像Base64変換開始 - URI:', image.uri);

        // URIの形式を正規化（Androidでは file:// が必要な場合がある）
        let normalizedUri = image.uri;
        if (!image.uri.startsWith('file://') && !image.uri.startsWith('content://')) {
          normalizedUri = `file://${image.uri}`;
          console.log('[GitHub] URI正規化:', normalizedUri);
        }

        // 画像をBase64に変換
        const base64Image = await FileSystem.readAsStringAsync(normalizedUri, {
          encoding: 'base64',
        });

        console.log('[GitHub] 画像Base64変換成功 - ファイル名:', image.fileName);

        treeEntries.push({
          path: imagePath,
          mode: '100644',
          type: 'blob',
          content: base64Image,
          encoding: 'base64',
        });
      }

      // 新しいツリーを作成
      const { data: newTree } = await this.octokit!.git.createTree({
        owner: this.config.owner,
        repo: this.config.repo,
        base_tree: baseTreeSha,
        tree: treeEntries,
      });

      // 新しいコミットを作成
      const commitMessage = images.length > 0
        ? `Add markdown file with ${images.length} image(s): ${fileName}`
        : `Add markdown file: ${fileName}`;

      const { data: newCommit } = await this.octokit!.git.createCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        message: commitMessage,
        tree: newTree.sha,
        parents: [latestCommitSha],
      });

      // ブランチの参照を更新
      await this.octokit!.git.updateRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${this.config.branch}`,
        sha: newCommit.sha,
      });

      // Markdownファイルのコンテンツ情報を取得してURLを返す
      const { data: fileData } = await this.octokit!.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: markdownPath,
        ref: this.config.branch,
      });

      if ('html_url' in fileData && fileData.html_url) {
        return fileData.html_url;
      }

      return '';
    } catch (error: any) {
      const appError: AppError = {
        message: error.message || 'Failed to create files on GitHub',
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
