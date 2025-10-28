import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, Linking } from 'react-native';
import { Text, Card, IconButton, FAB, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { storageService } from '../services/storageService';
import { HistoryEntry } from '../types';
import { formatDateToDisplay } from '../utils/dateFormatter';
import { InfoDialog } from '../components/InfoDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ダイアログ用の状態
  const [infoDialog, setInfoDialog] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    destructive?: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const entries = await storageService.getHistory();
      setHistory(entries);
    } catch (error) {
      console.error('Failed to load history:', error);
      setInfoDialog({ visible: true, title: 'エラー', message: '履歴の読み込みに失敗しました' });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      visible: true,
      title: '確認',
      message: 'この履歴を削除しますか?',
      confirmText: '削除',
      destructive: true,
      onConfirm: async () => {
        try {
          await storageService.deleteHistoryEntry(id);
          await loadHistory();
        } catch (error) {
          setInfoDialog({ visible: true, title: 'エラー', message: '削除に失敗しました' });
        }
      },
    });
  };

  const handleOpenUrl = async (url?: string) => {
    if (!url) {
      setInfoDialog({ visible: true, title: 'エラー', message: 'URLが見つかりません' });
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        setInfoDialog({ visible: true, title: 'エラー', message: 'URLを開けません' });
      }
    } catch (error) {
      setInfoDialog({ visible: true, title: 'エラー', message: 'URLを開けませんでした' });
    }
  };

  const handleClearAll = () => {
    setConfirmDialog({
      visible: true,
      title: '確認',
      message: 'すべての履歴を削除しますか?',
      confirmText: 'すべて削除',
      destructive: true,
      onConfirm: async () => {
        try {
          await storageService.clearHistory();
          await loadHistory();
        } catch (error) {
          setInfoDialog({ visible: true, title: 'エラー', message: '削除に失敗しました' });
        }
      },
    });
  };

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {formatDateToDisplay(item.createdAt.toISOString())}
            </Text>
            {item.githubUrl && (
              <IconButton
                icon="open-in-new"
                size={20}
                onPress={() => handleOpenUrl(item.githubUrl)}
              />
            )}
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => handleDelete(item.id)}
          />
        </View>
        {(item.tags?.primary || item.tags?.secondary || item.tag) && (
          <View style={styles.tagContainer}>
            {item.tags?.primary && (
              <Chip icon="tag" style={styles.primaryTagChip}>
                {item.tags.primary}
              </Chip>
            )}
            {item.tags?.secondary && (
              <Chip icon="flag" style={styles.secondaryTagChip}>
                {item.tags.secondary}
              </Chip>
            )}
            {/* 下位互換性: 旧タグフィールドの表示 */}
            {!item.tags && item.tag && (
              <Chip icon="tag" style={styles.tagChip}>
                {item.tag}
              </Chip>
            )}
          </View>
        )}
        <Text
          variant="bodyMedium"
          style={styles.contentPreview}
          numberOfLines={3}
        >
          {item.content}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="titleLarge" style={styles.emptyTitle}>
        送信履歴がありません
      </Text>
      <Text variant="bodyMedium" style={styles.emptyDescription}>
        ホームタブからテキストを送信すると、ここに履歴が表示されます
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            history.length === 0 ? styles.emptyListContainer : styles.listContainer
          }
          ListEmptyComponent={renderEmptyState}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />

        {history.length > 0 && (
          <FAB
            icon="delete-sweep"
            style={styles.fab}
            onPress={handleClearAll}
            label="すべて削除"
          />
        )}
      </View>

      <InfoDialog
        visible={infoDialog.visible}
        title={infoDialog.title}
        message={infoDialog.message}
        onDismiss={() => setInfoDialog({ ...infoDialog, visible: false })}
      />

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmDestructive={confirmDialog.destructive}
        onConfirm={confirmDialog.onConfirm}
        onDismiss={() => setConfirmDialog({ ...confirmDialog, visible: false })}
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
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  contentPreview: {
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyDescription: {
    textAlign: 'center',
    color: '#666666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#dc3545',
  },
  tagContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    alignSelf: 'flex-start',
  },
  primaryTagChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
  },
  secondaryTagChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3e0',
  },
});
