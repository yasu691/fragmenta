import { initialize, generateCaption, isInitialized } from '../src/services/geminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';

// モックを設定
jest.mock('@google/generative-ai');
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
}));

describe('geminiService', () => {
  const mockApiKey = 'test-api-key-12345';
  const mockImageUri = 'file:///path/to/image.jpg';
  const mockBase64 = 'base64encodedimagedata';
  const mockCaption = 'これは美しい風景の写真です。';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('APIキーで正しく初期化される', () => {
      expect(() => initialize(mockApiKey)).not.toThrow();
      expect(isInitialized()).toBe(true);
    });

    it('空のAPIキーでエラーをスローする', () => {
      expect(() => initialize('')).toThrow('Gemini API キーが設定されていません');
    });

    it('空白のみのAPIキーでエラーをスローする', () => {
      expect(() => initialize('   ')).toThrow('Gemini API キーが設定されていません');
    });
  });

  describe('generateCaption', () => {
    const mockGenerateContent = jest.fn();
    const mockGetGenerativeModel = jest.fn();

    beforeEach(() => {
      // GoogleGenerativeAI のモックを設定
      mockGetGenerativeModel.mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      // FileSystem のモックを設定
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockBase64);

      // initialize を呼び出し
      initialize(mockApiKey);
    });

    it('画像から正しくキャプションを生成する', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockCaption,
        },
      });

      const result = await generateCaption(mockImageUri);

      expect(result).toBe(mockCaption);
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(mockImageUri, {
        encoding: 'base64',
      });
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.5-flash' });
      expect(mockGenerateContent).toHaveBeenCalledWith([
        'この画像を1文で説明してください。',
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: mockBase64,
          },
        },
      ]);
    });

    it('メモ付きで正しくキャプションを生成する', async () => {
      const memo = 'これは旅行先で撮影した写真です';
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockCaption,
        },
      });

      const result = await generateCaption(mockImageUri, memo);

      expect(result).toBe(mockCaption);
      expect(mockGenerateContent).toHaveBeenCalledWith([
        `この画像を1文で説明してください。参考情報: ${memo}`,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: mockBase64,
          },
        },
      ]);
    });

    it('初期化されていない場合はエラーをスローする', async () => {
      // 新しいモジュールインスタンスを作成して初期化をリセット
      jest.resetModules();
      const { generateCaption: uninitializedGenerateCaption } = require('../src/services/geminiService');

      await expect(uninitializedGenerateCaption(mockImageUri)).rejects.toThrow(
        'Gemini API が初期化されていません'
      );
    });

    it('空のキャプションが返された場合はエラーをスローする', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '',
        },
      });

      await expect(generateCaption(mockImageUri)).rejects.toThrow(
        'キャプションの生成に失敗しました（空の応答）'
      );
    });

    it('Base64変換エラーをハンドリングする', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValue(
        new Error('ファイル読み込みエラー')
      );

      await expect(generateCaption(mockImageUri)).rejects.toThrow(
        '画像のBase64変換に失敗しました'
      );
    });

    it('APIキーエラーをハンドリングする', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API_KEY_INVALID'));

      await expect(generateCaption(mockImageUri)).rejects.toThrow(
        'Gemini API キーが無効です'
      );
    });

    it('レート制限エラーをハンドリングする', async () => {
      mockGenerateContent.mockRejectedValue(new Error('429 RATE_LIMIT_EXCEEDED'));

      await expect(generateCaption(mockImageUri)).rejects.toThrow(
        'APIのレート制限に達しました'
      );
    });
  });

  describe('isInitialized', () => {
    it('初期化前はfalseを返す', () => {
      jest.resetModules();
      const { isInitialized: freshIsInitialized } = require('../src/services/geminiService');
      expect(freshIsInitialized()).toBe(false);
    });

    it('初期化後はtrueを返す', () => {
      initialize(mockApiKey);
      expect(isInitialized()).toBe(true);
    });
  });
});
