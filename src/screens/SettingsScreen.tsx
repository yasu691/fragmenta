import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storageService } from '../services/storageService';
import { githubService } from '../services/githubService';
import { GitHubConfig } from '../types';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const SettingsScreen: React.FC = () => {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [branch, setBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsInitializing(true);
      const config = await storageService.getGitHubConfig();
      if (config) {
        setToken(config.token);
        setOwner(config.owner);
        setRepo(config.repo);
        setFolderPath(config.folderPath);
        setBranch(config.branch);
      }
    } catch (error) {
      Alert.alert('エラー', '設定の読み込みに失敗しました');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSave = async () => {
    // バリデーション
    if (!token || !owner || !repo || !branch) {
      Alert.alert('エラー', 'すべての必須項目を入力してください');
      return;
    }

    setLoading(true);

    try {
      const config: GitHubConfig = {
        token,
        owner,
        repo,
        folderPath,
        branch,
      };

      // 設定の検証
      const isValid = await githubService.validateConfig(config);
      if (!isValid) {
        Alert.alert(
          'エラー',
          '設定が無効です。トークンやリポジトリ情報を確認してください。'
        );
        setLoading(false);
        return;
      }

      // 設定を保存
      await storageService.saveGitHubToken(token);
      await storageService.saveGitHubConfig({
        owner,
        repo,
        folderPath,
        branch,
      });

      // GitHubServiceを初期化
      githubService.initialize(config);

      Alert.alert('成功', '設定を保存しました');
    } catch (error: any) {
      Alert.alert('エラー', error.message || '設定の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    Alert.alert(
      '確認',
      '設定をクリアしますか?',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'クリア',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearGitHubConfig();
            setToken('');
            setOwner('');
            setRepo('');
            setFolderPath('');
            setBranch('main');
            Alert.alert('完了', '設定をクリアしました');
          },
        },
      ]
    );
  };

  if (isInitializing) {
    return <LoadingOverlay visible={true} message="設定を読み込み中..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.title}>
            GitHub設定
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            GitHubのプライベートリポジトリに接続するための設定を行います。
          </Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <TextInput
            label="Personal Access Token *"
            value={token}
            onChangeText={setToken}
            mode="outlined"
            secureTextEntry
            placeholder="ghp_xxxxxxxxxxxx"
            style={styles.input}
          />
          <Text variant="bodySmall" style={styles.hint}>
            repo スコープを持つトークンが必要です
          </Text>

          <TextInput
            label="リポジトリオーナー *"
            value={owner}
            onChangeText={setOwner}
            mode="outlined"
            placeholder="username"
            style={styles.input}
            autoCapitalize="none"
          />

          <TextInput
            label="リポジトリ名 *"
            value={repo}
            onChangeText={setRepo}
            mode="outlined"
            placeholder="repository-name"
            style={styles.input}
            autoCapitalize="none"
          />

          <TextInput
            label="保存先フォルダパス"
            value={folderPath}
            onChangeText={setFolderPath}
            mode="outlined"
            placeholder="docs/notes (空欄の場合はルート)"
            style={styles.input}
            autoCapitalize="none"
          />

          <TextInput
            label="ブランチ名 *"
            value={branch}
            onChangeText={setBranch}
            mode="outlined"
            placeholder="main"
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            disabled={loading}
          >
            設定を保存
          </Button>

          <Button
            mode="outlined"
            onPress={handleClear}
            style={styles.clearButton}
            disabled={loading}
          >
            設定をクリア
          </Button>
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading} message="設定を検証中..." />
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
  section: {
    padding: 20,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  description: {
    color: '#666666',
  },
  divider: {
    marginVertical: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  hint: {
    marginTop: -8,
    marginBottom: 12,
    color: '#666666',
    marginLeft: 12,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 0,
  },
  saveButton: {
    marginBottom: 12,
  },
  clearButton: {
    marginBottom: 12,
  },
});
