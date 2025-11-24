import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';

let genAI: GoogleGenerativeAI | null = null;
let currentApiKey: string | null = null;

/**
 * Gemini API クライアントを初期化
 * @param apiKey - Gemini API キー
 */
export const initialize = (apiKey: string): void => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Gemini API キーが設定されていません');
  }

  currentApiKey = apiKey;
  genAI = new GoogleGenerativeAI(apiKey);
};

/**
 * 画像をBase64に変換
 * @param imageUri - 画像のURI
 * @returns Base64エンコードされた画像データ
 */
const imageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    console.log('[Gemini] Base64変換開始 - URI:', imageUri);

    // URIの形式を正規化（Androidでは file:// が必要な場合がある）
    let normalizedUri = imageUri;
    if (!imageUri.startsWith('file://') && !imageUri.startsWith('content://')) {
      normalizedUri = `file://${imageUri}`;
      console.log('[Gemini] URI正規化:', normalizedUri);
    }

    // expo-file-system を使ってBase64に変換
    const base64 = await FileSystem.readAsStringAsync(normalizedUri, {
      encoding: 'base64',
    });

    console.log('[Gemini] Base64変換成功 - データサイズ:', base64.length);
    return base64;
  } catch (error) {
    console.error('[Gemini] Base64変換エラー - URI:', imageUri);
    console.error('[Gemini] エラー詳細:', error);
    throw new Error(`画像のBase64変換に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
};

/**
 * 画像からキャプションを生成
 * @param imageUri - 画像のURI
 * @param memo - ユーザーが入力したメモ（オプショナル）
 * @returns 生成されたキャプション
 */
export const generateCaption = async (
  imageUri: string,
  memo?: string
): Promise<string> => {
  if (!genAI || !currentApiKey) {
    throw new Error('Gemini API が初期化されていません。initialize() を先に呼び出してください');
  }

  try {
    // モデルを取得（Gemini 2.5 Flash）
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 画像をBase64に変換
    const base64Image = await imageToBase64(imageUri);

    // プロンプトを構築
    let prompt = 'この画像に含まれるテキスト、数式、コード、図表などの文字情報を優先的に抽出し、実用的に説明してください。画像がスクリーンショットやドキュメントの場合は、表示されている内容を詳しく記述してください。色や雰囲気の説明は最小限にしてください。';
    if (memo && memo.trim() !== '') {
      prompt = `この画像に含まれるテキスト、数式、コード、図表などの文字情報を優先的に抽出し、実用的に説明してください。画像がスクリーンショットやドキュメントの場合は、表示されている内容を詳しく記述してください。色や雰囲気の説明は最小限にしてください。\n\n参考情報: ${memo}`;
    }

    // コンテンツを生成
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
    ]);

    const response = result.response;
    const caption = response.text();

    if (!caption || caption.trim() === '') {
      throw new Error('キャプションの生成に失敗しました（空の応答）');
    }

    return caption.trim();
  } catch (error) {
    console.error('Gemini API エラー:', error);

    if (error instanceof Error) {
      // API キーエラーの場合
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        throw new Error('Gemini API キーが無効です。設定を確認してください');
      }
      // レート制限エラーの場合
      if (error.message.includes('429') || error.message.includes('RATE_LIMIT')) {
        throw new Error('APIのレート制限に達しました。しばらく待ってから再試行してください');
      }
      throw new Error(`キャプション生成に失敗しました: ${error.message}`);
    }

    throw new Error('キャプション生成に失敗しました（不明なエラー）');
  }
};

/**
 * 複数の画像から一括でキャプションを生成
 * @param imageUris - 画像URIの配列
 * @param memo - ユーザーが入力したメモ（オプショナル）
 * @returns 生成されたキャプションの配列
 */
export const generateCaptions = async (
  imageUris: string[],
  memo?: string
): Promise<string[]> => {
  const captions = await Promise.all(
    imageUris.map((uri) => generateCaption(uri, memo))
  );
  return captions;
};

/**
 * API キーが設定されているか確認
 * @returns 設定されていれば true
 */
export const isInitialized = (): boolean => {
  return genAI !== null && currentApiKey !== null;
};
