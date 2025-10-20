/**
 * 日時を yyyymmddhhmmss フォーマットに変換
 * @param date - 変換対象の日時 (デフォルトは現在時刻)
 * @returns yyyymmddhhmmss形式の文字列
 */
export const formatDateToFileName = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}.md`;
};

/**
 * ISO文字列から表示用の日時文字列に変換
 * @param isoString - ISO形式の日時文字列
 * @returns 表示用の日時文字列 (例: 2025-10-19 14:30:52)
 */
export const formatDateToDisplay = (isoString: string): string => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
