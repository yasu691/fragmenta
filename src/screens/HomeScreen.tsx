import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { storageService } from '../services/storageService';
import { githubService } from '../services/githubService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ErrorDialog } from '../components/ErrorDialog';
import { AppError } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // 画面がフォーカスされたときに設定をチェック
  useFocusEffect(
    useCallback(() => {
      checkConfiguration();
      loadDraft();
    }, [])
  );

  // 設定の存在確認とGitHubServiceの初期化
  const checkConfiguration = async () => {
    try {
      const hasConfig = await storageService.hasGitHubConfig();
      setIsConfigured(hasConfig);

      if (hasConfig) {
        const config = await storageService.getGitHubConfig();
        if (config) {
          githubService.initialize(config);
        }
      }
    } catch (error) {
      console.error('Failed to check configuration:', error);
    }
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
    if (!isConfigured) {
      Alert.alert(
        '設定が必要です',
        'GitHub設定を行ってください',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '設定画面へ',
            onPress: () => navigation.navigate('Settings'),
          },
        ]
      );
      return;
    }

    if (!text.trim()) {
      Alert.alert('エラー', 'テキストを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // GitHubにMarkdownファイルを作成
      const fileUrl = await submitWithRetry(text);

      // 履歴に追加
      await storageService.addHistory({
        fileName: new Date().toISOString(),
        content: text,
        createdAt: new Date(),
        githubUrl: fileUrl,
      });

      // 下書きをクリア
      await storageService.clearDraft();

      // 入力欄をクリア
      setText('');

      Alert.alert(
        '成功',
        'GitHubに送信しました',
        [
          {
            text: 'OK',
            onPress: () => {
              // 必要に応じて履歴画面に遷移
              // navigation.navigate('History');
            },
          },
        ]
      );
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          {!isConfigured && (
            <View style={styles.warningBanner}>
              <Text variant="bodyMedium" style={styles.warningText}>
                GitHub設定が必要です。設定タブから設定してください。
              </Text>
            </View>
          )}

          <TextInput
            label="メッセージを入力"
            value={text}
            onChangeText={setText}
            mode="outlined"
            multiline
            numberOfLines={8}
            style={styles.textInput}
            placeholder="ここにテキストを入力してください"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            contentStyle={styles.buttonContent}
            disabled={loading || !isConfigured}
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
});
