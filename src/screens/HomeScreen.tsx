import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ScrollView } from 'react-native';
import { TextInput, Button, Text, Menu, IconButton, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { storageService } from '../services/storageService';
import { githubService } from '../services/githubService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ErrorDialog } from '../components/ErrorDialog';
import { AppError, Tag, ImageData } from '../types';
import { addFrontmatter } from '../utils/frontmatterParser';
import { useGitHubConfig } from '../contexts/GitHubConfigContext';
import { InfoDialog } from '../components/InfoDialog';
import { ChoiceDialog } from '../components/ChoiceDialog';
import { processImage, generateImageFileName } from '../utils/imageProcessor';
import { initialize as initializeGemini, generateCaptions } from '../services/geminiService';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { config } = useGitHubConfig();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const [primaryTags, setPrimaryTags] = useState<Tag[]>([]);
  const [secondaryTags, setSecondaryTags] = useState<Tag[]>([]);
  const [selectedPrimaryTag, setSelectedPrimaryTag] = useState<string | undefined>(undefined);
  const [selectedSecondaryTag, setSelectedSecondaryTag] = useState<string | undefined>(undefined);
  const [primaryMenuVisible, setPrimaryMenuVisible] = useState(false);
  const [secondaryMenuVisible, setSecondaryMenuVisible] = useState(false);

  // 画像関連の state
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);

  // ダイアログ用の状態
  const [infoDialog, setInfoDialog] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });
  const [choiceDialog, setChoiceDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    actions: Array<{ text: string; onPress: () => void }>;
  }>({
    visible: false,
    title: '',
    message: '',
    actions: [],
  });

  useFocusEffect(
    useCallback(() => {
      checkConfiguration();
      loadDraft();
      loadTags();
    }, [config])
  );

  const checkConfiguration = async () => {
    try {
      if (config) {
        githubService.initialize(config);
        // Gemini APIキーが設定されていれば初期化
        const geminiApiKey = storageService.getGeminiApiKey();
        if (geminiApiKey) {
          initializeGemini(geminiApiKey);
        }
      }
    } catch (error) {
      console.error('Failed to check configuration:', error);
    }
  };

  // 画像を選択
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setLoading(true);
        const now = new Date();
        const newImages: ImageData[] = [];

        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i];
          // 高解像度版（Gemini用: 2400px）
          const highResUri = await processImage(asset.uri, 2400, 0.85);
          // 低解像度版（GitHub保存用: 1280px）
          const lowResUri = await processImage(asset.uri, 1280, 0.85);
          // ファイル名生成
          const fileName = generateImageFileName(selectedImages.length + i + 1, now);

          newImages.push({
            uri: lowResUri,
            highResUri: highResUri,
            caption: '', // キャプションは後で生成
            fileName,
          });
        }

        setSelectedImages([...selectedImages, ...newImages]);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      setError({
        message: '画像の選択に失敗しました',
        retry: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // 画像を削除
  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  // 下書きを読み込む
  const loadDraft = async () => {
    try {
      const draft = await storageService.getDraft();
      if (draft) {
        setText(draft.content);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  // タグを読み込む
  const loadTags = async () => {
    try {
      const loadedPrimaryTags = await storageService.getTags('primary');
      const loadedSecondaryTags = await storageService.getTags('secondary');
      setPrimaryTags(loadedPrimaryTags.sort((a, b) => a.order - b.order));
      setSecondaryTags(loadedSecondaryTags.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  // 下書き自動保存
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text) {
        storageService.saveDraft(text).catch(console.error);
      }
    }, 1000); // 1秒後に保存

    return () => clearTimeout(timer);
  }, [text]);

  // リトライ機能付きの送信処理
  const submitWithRetry = async (
    content: string,
    attemptCount: number = 0
  ): Promise<string> => {
    const settings = await storageService.getSettings();
    const maxAttempts = settings.retryAttempts;

    try {
      return await githubService.createMarkdownFile(content);
    } catch (error: any) {
      const appError: AppError = error as AppError;

      // リトライ可能なエラーで、試行回数が上限未満の場合
      if (appError.retry && attemptCount < maxAttempts - 1) {
        // 遅延後にリトライ
        await new Promise((resolve) =>
          setTimeout(resolve, settings.retryDelay)
        );
        return submitWithRetry(content, attemptCount + 1);
      }

      // リトライ不可能またはリトライ上限に達した
      throw appError;
    }
  };

  const handleSubmit = async () => {
    if (!config) {
      setChoiceDialog({
        visible: true,
        title: '設定が必要です',
        message: 'GitHub設定を行ってください',
        actions: [
          {
            text: '設定画面へ',
            onPress: () => navigation.navigate('Settings'),
          },
        ],
      });
      return;
    }

    if (!text.trim() && selectedImages.length === 0) {
      setInfoDialog({ visible: true, title: 'エラー', message: 'テキストまたは画像を入力してください' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imagesWithCaptions = selectedImages;

      // 画像がある場合、Geminiでキャプション生成
      if (selectedImages.length > 0) {
        const geminiApiKey = storageService.getGeminiApiKey();
        if (!geminiApiKey) {
          setChoiceDialog({
            visible: true,
            title: 'Gemini API キーが必要です',
            message: '画像のキャプションを生成するには Gemini API キーが必要です',
            actions: [
              {
                text: '設定画面へ',
                onPress: () => navigation.navigate('Settings'),
              },
            ],
          });
          setLoading(false);
          return;
        }

        try {
          const imageUris = selectedImages.map((img) => img.highResUri);
          const captions = await generateCaptions(imageUris, text);

          imagesWithCaptions = selectedImages.map((img, index) => ({
            ...img,
            caption: captions[index] || '',
          }));
        } catch (error: any) {
          console.error('Caption generation error:', error);
          setError({
            message: `キャプション生成に失敗しました: ${error.message}`,
            retry: false,
          });
          setLoading(false);
          return;
        }
      }

      // Frontmatter を追加したコンテンツを作成
      const tags = {
        primary: selectedPrimaryTag,
        secondary: selectedSecondaryTag,
      };
      const contentWithFrontmatter = addFrontmatter(text, tags);

      // GitHubに Markdown + 画像をアップロード
      const fileUrl =
        imagesWithCaptions.length > 0
          ? await githubService.createMarkdownWithImages(contentWithFrontmatter, imagesWithCaptions)
          : await submitWithRetry(contentWithFrontmatter);

      // 履歴に追加
      await storageService.addHistory({
        fileName: new Date().toISOString(),
        content: text,
        createdAt: new Date(),
        githubUrl: fileUrl,
        tags,
        images: imagesWithCaptions.length > 0 ? imagesWithCaptions : undefined,
      });

      // 下書きをクリア
      await storageService.clearDraft();

      // 入力欄と画像をクリア（タグ選択は維持）
      setText('');
      setSelectedImages([]);

      setInfoDialog({ visible: true, title: '成功', message: 'GitHubに送信しました' });
    } catch (error: any) {
      console.error('Submit error:', error);
      const appError: AppError = error as AppError;
      setError({
        message: appError.message || '送信に失敗しました',
        code: appError.code,
        retry: appError.retry || false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSubmit();
  };

  // Ctrl+Enter または Cmd+Enter で送信
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && (e.nativeEvent.ctrlKey || e.nativeEvent.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          {!config && (
            <View style={styles.warningBanner}>
              <Text variant="bodyMedium" style={styles.warningText}>
                GitHub設定が必要です。設定タブから設定してください。
              </Text>
            </View>
          )}

          {/* タグ1選択メニュー */}
          {primaryTags.length > 0 && (
            <View style={styles.tagContainer}>
              <Text variant="bodyMedium" style={styles.tagLabel}>
                タグ1:
              </Text>
              <View style={styles.tagButton}>
                <Menu
                  visible={primaryMenuVisible}
                  onDismiss={() => setPrimaryMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      onPress={() => setPrimaryMenuVisible(!primaryMenuVisible)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.tagButtonContent}>
                        <Text variant="bodyMedium" style={styles.tagButtonText}>
                          {selectedPrimaryTag || 'タグなし'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setSelectedPrimaryTag(undefined);
                      setPrimaryMenuVisible(false);
                    }}
                    title="タグなし"
                  />
                  {primaryTags.map((tag) => (
                    <Menu.Item
                      key={tag.id}
                      onPress={() => {
                        setSelectedPrimaryTag(tag.name);
                        setPrimaryMenuVisible(false);
                      }}
                      title={tag.name}
                    />
                  ))}
                </Menu>
              </View>
            </View>
          )}

          {/* タグ2選択メニュー */}
          {secondaryTags.length > 0 && (
            <View style={styles.tagContainer}>
              <Text variant="bodyMedium" style={styles.tagLabel}>
                タグ2:
              </Text>
              <View style={styles.tagButton}>
                <Menu
                  visible={secondaryMenuVisible}
                  onDismiss={() => setSecondaryMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      onPress={() => setSecondaryMenuVisible(!secondaryMenuVisible)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.tagButtonContent}>
                        <Text variant="bodyMedium" style={styles.tagButtonText}>
                          {selectedSecondaryTag || 'タグなし'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setSelectedSecondaryTag(undefined);
                      setSecondaryMenuVisible(false);
                    }}
                    title="タグなし"
                  />
                  {secondaryTags.map((tag) => (
                    <Menu.Item
                      key={tag.id}
                      onPress={() => {
                        setSelectedSecondaryTag(tag.name);
                        setSecondaryMenuVisible(false);
                      }}
                      title={tag.name}
                    />
                  ))}
                </Menu>
              </View>
            </View>
          )}

          <TextInput
            label="メッセージを入力"
            value={text}
            onChangeText={setText}
            onKeyPress={handleKeyPress}
            mode="outlined"
            multiline
            numberOfLines={8}
            style={styles.textInput}
            placeholder="ここにテキストを入力してください"
          />

          {/* 画像選択ボタン */}
          <Button
            mode="outlined"
            onPress={handlePickImage}
            style={styles.imageButton}
            icon="image-plus"
            disabled={loading}
          >
            画像を追加
          </Button>

          {/* 画像プレビュー */}
          {selectedImages.length > 0 && (
            <ScrollView horizontal style={styles.imagePreviewContainer}>
              {selectedImages.map((image, index) => (
                <Card key={index} style={styles.imageCard}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                  <IconButton
                    icon="close-circle"
                    size={24}
                    onPress={() => handleRemoveImage(index)}
                    style={styles.removeImageButton}
                  />
                </Card>
              ))}
            </ScrollView>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            contentStyle={styles.buttonContent}
            disabled={loading || !config}
          >
            GitHubに送信
          </Button>
        </View>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} message="GitHubに送信中..." />

      <ErrorDialog
        visible={!!error}
        message={error?.message || ''}
        onDismiss={() => setError(null)}
        onRetry={error?.retry ? handleRetry : undefined}
        retryEnabled={error?.retry}
      />

      <InfoDialog
        visible={infoDialog.visible}
        title={infoDialog.title}
        message={infoDialog.message}
        onDismiss={() => setInfoDialog({ ...infoDialog, visible: false })}
      />

      <ChoiceDialog
        visible={choiceDialog.visible}
        title={choiceDialog.title}
        message={choiceDialog.message}
        actions={choiceDialog.actions}
        onDismiss={() => setChoiceDialog({ ...choiceDialog, visible: false })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  warningBanner: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    color: '#856404',
  },
  textInput: {
    backgroundColor: '#ffffff',
    minHeight: 150,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagLabel: {
    marginRight: 8,
    fontWeight: '600',
  },
  tagButton: {
    flex: 1,
  },
  tagButtonContent: {
    borderWidth: 1,
    borderColor: '#6200ee',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagButtonText: {
    color: '#6200ee',
    fontWeight: '500',
  },
  imageButton: {
    marginBottom: 16,
  },
  imagePreviewContainer: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  imageCard: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
  },
});
