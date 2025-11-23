import { generateImageFileName, processImage } from '../src/utils/imageProcessor';
import * as ImageManipulator from 'expo-image-manipulator';

// expo-image-manipulator をモック
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

describe('imageProcessor', () => {
  describe('generateImageFileName', () => {
    it('正しい形式のファイル名を生成する (index=1)', () => {
      const testDate = new Date('2025-11-23T14:30:45');
      const fileName = generateImageFileName(1, testDate);
      expect(fileName).toBe('20251123143045-1.png');
    });

    it('正しい形式のファイル名を生成する (index=5)', () => {
      const testDate = new Date('2025-11-23T09:05:03');
      const fileName = generateImageFileName(5, testDate);
      expect(fileName).toBe('20251123090503-5.png');
    });

    it('デフォルトで現在時刻を使用する', () => {
      const fileName = generateImageFileName(1);
      // 現在時刻なので、形式だけチェック
      expect(fileName).toMatch(/^\d{14}-1\.png$/);
    });

    it('月・日・時・分・秒が1桁の場合は0埋めする', () => {
      const testDate = new Date('2025-01-05T08:07:06');
      const fileName = generateImageFileName(2, testDate);
      expect(fileName).toBe('20250105080706-2.png');
    });
  });

  describe('processImage', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('画像を正しくリサイズ・圧縮する', async () => {
      const mockUri = 'file:///path/to/image.jpg';
      const mockResult = { uri: 'file:///path/to/processed.jpg' };

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue(mockResult);

      const result = await processImage(mockUri, 2400, 0.85);

      expect(result).toBe(mockResult.uri);
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 2400 } }],
        { compress: 0.85, format: 'jpeg' }
      );
    });

    it('デフォルトパラメータで動作する', async () => {
      const mockUri = 'file:///path/to/image.jpg';
      const mockResult = { uri: 'file:///path/to/processed.jpg' };

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue(mockResult);

      await processImage(mockUri);

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 2400 } }],
        { compress: 0.85, format: 'jpeg' }
      );
    });

    it('エラーが発生した場合は例外をスローする', async () => {
      const mockUri = 'file:///path/to/invalid.jpg';
      const mockError = new Error('画像読み込みエラー');

      (ImageManipulator.manipulateAsync as jest.Mock).mockRejectedValue(mockError);

      await expect(processImage(mockUri)).rejects.toThrow('画像処理に失敗しました');
    });
  });
});
