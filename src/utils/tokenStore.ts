/**
 * TokenStore の型定義
 * 実際の実装はプラットフォーム別ファイル (.web.ts / .native.ts) にある
 */

export type TokenData = {
  token: string;
  owner: string;
  repo: string;
  folderPath: string;
  branch: string;
} | null;

export interface TokenStoreInterface {
  loadFromSecureStore?(): Promise<void>;
  set(data: TokenData): void;
  get(): TokenData;
  clear(): void;
  hasToken(): boolean;
}

// このファイルは型定義のためだけに存在し、実際の実装は含まない
// React Native の Metro bundler が自動的に .web.ts または .native.ts を選択する
declare const TokenStore: TokenStoreInterface;
export { TokenStore };
