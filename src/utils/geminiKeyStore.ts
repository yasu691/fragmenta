/**
 * GeminiKeyStore の型定義
 * 実際の実装はプラットフォーム別ファイル (.web.ts / .native.ts) にある
 *
 * プラットフォーム別の動作:
 * - Web: sessionStorage (タブを閉じると揮発)
 * - Native (Android/iOS): SecureStore (端末に永続保存)
 */

export interface GeminiKeyStoreInterface {
  loadFromSecureStore?(): Promise<void>;
  set(apiKey: string | null): void;
  get(): string | null;
  clear(): void;
  hasKey(): boolean;
}

// このファイルは型定義のためだけに存在し、実際の実装は含まない
// React Native の Metro bundler が自動的に .web.ts または .native.ts を選択する
declare const GeminiKeyStore: GeminiKeyStoreInterface;
export { GeminiKeyStore };
