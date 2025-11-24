import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';

/**
 * 画像ファイル名を生成する
 * @param index - 画像のインデックス (1始まり)
 * @param date - 基準日時 (デフォルトは現在時刻)
 * @returns yyyymmddhhmmss-n.png 形式のファイル名
 */
export const generateImageFileName = (index: number, date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}-${index}.png`;
};

/**
 * 画像のサイズを取得する（アスペクト比を維持）
 * @param uri - 画像のURI
 * @returns { width, height }
 */
const getImageSize = async (uri: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    if (typeof Image !== 'undefined') {
      // Web環境
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = uri;
    } else {
      // React Native環境では Image.getSize を使う
      // ただし、expo-image-manipulator が自動でサイズ調整するため、
      // ここでは最大サイズを想定
      resolve({ width: 3000, height: 3000 }); // デフォルト値
    }
  });
};

/**
 * 画像をリサイズ・圧縮する
 * @param uri - 元画像のURI
 * @param maxSize - 最大ピクセルサイズ（幅・高さの最大値）
 * @param quality - JPEG圧縮品質 (0-1)
 * @returns 処理後の画像URI
 */
export const processImage = async (
  uri: string,
  maxSize: number = 2400,
  quality: number = 0.85
): Promise<string> => {
  try {
    console.log('[ImageProcessor] 画像処理開始 - 元URI:', uri);

    // 画像を処理（リサイズと圧縮）
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: maxSize,
            // height は自動的にアスペクト比を維持して計算される
          },
        },
      ],
      {
        compress: quality,
        format: SaveFormat.JPEG,
      }
    );

    console.log('[ImageProcessor] 画像処理完了 - 処理後URI:', result.uri);
    return result.uri;
  } catch (error) {
    console.error('[ImageProcessor] 画像処理エラー - 元URI:', uri);
    console.error('[ImageProcessor] エラー詳細:', error);
    throw new Error(`画像処理に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
};

/**
 * 複数の画像を一括処理する
 * @param uris - 画像URIの配列
 * @param maxSize - 最大ピクセルサイズ
 * @param quality - JPEG圧縮品質 (0-1)
 * @returns 処理後の画像URIの配列
 */
export const processImages = async (
  uris: string[],
  maxSize: number = 2400,
  quality: number = 0.85
): Promise<string[]> => {
  const results = await Promise.all(
    uris.map((uri) => processImage(uri, maxSize, quality))
  );
  return results;
};
