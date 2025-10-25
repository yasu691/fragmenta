import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, View, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Divider, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storageService } from '../services/storageService';
import { githubService } from '../services/githubService';
import { GitHubConfig, Tag } from '../types';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useGitHubConfig } from '../contexts/GitHubConfigContext';

export const SettingsScreen: React.FC = () => {
  const { config: savedConfig, setConfig, clearConfig } = useGitHubConfig();
  
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [branch, setBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // タグ管理用の状態
  const [primaryTags, setPrimaryTags] = useState<Tag[]>([]);
  const [secondaryTags, setSecondaryTags] = useState<Tag[]>([]);
  const [showPrimaryAddDialog, setShowPrimaryAddDialog] = useState(false);
  const [showSecondaryAddDialog, setShowSecondaryAddDialog] = useState(false);
  const [newPrimaryTagName, setNewPrimaryTagName] = useState('');
  const [newSecondaryTagName, setNewSecondaryTagName] = useState('');

  // スクロール制御用
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadSettings();
    loadTags();
  }, []);

  const loadSettings = async () => {
    try {
      setIsInitializing(true);
      const config = await storageService.getGitHubConfig();
      if (config) {
        setOwner(config.owner);
        setRepo(config.repo);
        setFolderPath(config.folderPath);
        setBranch(config.branch);
      }
      if (savedConfig) {
        setToken(savedConfig.token);
      }
    } catch (error) {
      Alert.alert('エラー', '設定の読み込みに失敗しました');
    } finally {
      setIsInitializing(false);
    }
  };

  const loadTags = async () => {
    try {
      const loadedPrimaryTags = await storageService.getTags('primary');
      const loadedSecondaryTags = await storageService.getTags('secondary');
      setPrimaryTags(loadedPrimaryTags.sort((a, b) => a.order - b.order));
      setSecondaryTags(loadedSecondaryTags.sort((a, b) => a.order - b.order));
    } catch (error) {
      Alert.alert('エラー', 'タグの読み込みに失敗しました');
    }
  };

  const handleSave = async () => {
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

      const isValid = await githubService.validateConfig(config);
      if (!isValid) {
        Alert.alert(
          'エラー',
          '設定が無効です。トークンやリポジトリ情報を確認してください。'
        );
        setLoading(false);
        return;
      }

      await storageService.saveGitHubConfig({
        owner,
        repo,
        folderPath,
        branch,
      });

      setConfig(config);

      githubService.initialize(config);

      Alert.alert('成功', '設定を保存しました（トークンはメモリに保存されます。ページをリロードすると再入力が必要です）');
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
            clearConfig();
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

  // タグ1追加
  const handleAddPrimaryTag = async () => {
    if (!newPrimaryTagName.trim()) {
      Alert.alert('エラー', 'タグ名を入力してください');
      return;
    }

    try {
      await storageService.addTag(newPrimaryTagName.trim(), 'primary');
      await loadTags();
      setNewPrimaryTagName('');
      setShowPrimaryAddDialog(false);
      Alert.alert('成功', 'タグ1を追加しました');
    } catch (error: any) {
      Alert.alert('エラー', error.message || 'タグの追加に失敗しました');
    }
  };

  // タグ2追加
  const handleAddSecondaryTag = async () => {
    if (!newSecondaryTagName.trim()) {
      Alert.alert('エラー', 'タグ名を入力してください');
      return;
    }

    try {
      await storageService.addTag(newSecondaryTagName.trim(), 'secondary');
      await loadTags();
      setNewSecondaryTagName('');
      setShowSecondaryAddDialog(false);
      Alert.alert('成功', 'タグ2を追加しました');
    } catch (error: any) {
      Alert.alert('エラー', error.message || 'タグの追加に失敗しました');
    }
  };

  // タグ削除
  const handleDeleteTag = async (id: string) => {
    Alert.alert(
      '確認',
      'このタグを削除しますか?',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteTag(id);
              await loadTags();
              Alert.alert('成功', 'タグを削除しました');
            } catch (error: any) {
              Alert.alert('エラー', 'タグの削除に失敗しました');
            }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView ref={scrollViewRef} style={styles.container}>
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

        <Divider style={styles.divider} />

        {/* タグ1管理セクション */}
        <View style={styles.section}>
          <View style={styles.tagHeader}>
            <View>
              <Text variant="titleLarge" style={styles.title}>
                タグ1管理
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                投稿時に選択できるタグ1を管理します。
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={() => setShowPrimaryAddDialog(true)}
              icon="plus"
            >
              追加
            </Button>
          </View>

          {/* タグ1追加カード */}
          {showPrimaryAddDialog && (
            <Card style={styles.addTagCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.addTagTitle}>
                  新しいタグ1を追加
                </Text>
                <TextInput
                  label="タグ名"
                  value={newPrimaryTagName}
                  onChangeText={setNewPrimaryTagName}
                  mode="outlined"
                  placeholder="例: 仕事、個人、趣味"
                  style={styles.addTagInput}
                  onFocus={() => {
                    // キーボード表示時にスクロール
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
                <View style={styles.addTagActions}>
                  <Button
                    onPress={() => {
                      setShowPrimaryAddDialog(false);
                      setNewPrimaryTagName('');
                    }}
                    style={styles.addTagButton}
                  >
                    キャンセル
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleAddPrimaryTag}
                    style={styles.addTagButton}
                  >
                    追加
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}

          {primaryTags.length === 0 ? (
            <Text style={styles.emptyText}>タグ1が登録されていません</Text>
          ) : (
            <FlatList
              data={primaryTags}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Card style={styles.tagCard}>
                  <Card.Content style={styles.tagCardContent}>
                    <Text variant="bodyLarge">{item.name}</Text>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDeleteTag(item.id)}
                    />
                  </Card.Content>
                </Card>
              )}
            />
          )}
        </View>

        <Divider style={styles.divider} />

        {/* タグ2管理セクション */}
        <View style={styles.section}>
          <View style={styles.tagHeader}>
            <View>
              <Text variant="titleLarge" style={styles.title}>
                タグ2管理
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                投稿時に選択できるタグ2を管理します。
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={() => setShowSecondaryAddDialog(true)}
              icon="plus"
            >
              追加
            </Button>
          </View>

          {/* タグ2追加カード */}
          {showSecondaryAddDialog && (
            <Card style={styles.addTagCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.addTagTitle}>
                  新しいタグ2を追加
                </Text>
                <TextInput
                  label="タグ名"
                  value={newSecondaryTagName}
                  onChangeText={setNewSecondaryTagName}
                  mode="outlined"
                  placeholder="例: 緊急、重要、低"
                  style={styles.addTagInput}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
                <View style={styles.addTagActions}>
                  <Button
                    onPress={() => {
                      setShowSecondaryAddDialog(false);
                      setNewSecondaryTagName('');
                    }}
                    style={styles.addTagButton}
                  >
                    キャンセル
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleAddSecondaryTag}
                    style={styles.addTagButton}
                  >
                    追加
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}

          {secondaryTags.length === 0 ? (
            <Text style={styles.emptyText}>タグ2が登録されていません</Text>
          ) : (
            <FlatList
              data={secondaryTags}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Card style={styles.tagCard}>
                  <Card.Content style={styles.tagCardContent}>
                    <Text variant="bodyLarge">{item.name}</Text>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDeleteTag(item.id)}
                    />
                  </Card.Content>
                </Card>
              )}
            />
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} message="設定を検証中..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
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
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    marginVertical: 20,
  },
  tagCard: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  tagCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addTagCard: {
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
  },
  addTagTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  addTagInput: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  addTagActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  addTagButton: {
    marginLeft: 8,
  },
});
