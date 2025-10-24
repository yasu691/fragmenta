type TokenData = {
  token: string;
  owner: string;
  repo: string;
  folderPath: string;
  branch: string;
} | null;

let tokenData: TokenData = null;

export const TokenStore = {
  set(data: TokenData): void {
    tokenData = data;
  },

  get(): TokenData {
    return tokenData;
  },

  clear(): void {
    tokenData = null;
  },

  hasToken(): boolean {
    return tokenData !== null && tokenData.token !== '';
  }
};
