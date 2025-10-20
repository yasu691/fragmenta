import React from 'react';
import { StyleSheet } from 'react-native';
import { Dialog, Portal, Text, Button } from 'react-native-paper';

interface ErrorDialogProps {
  visible: boolean;
  title?: string;
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
  retryEnabled?: boolean;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  visible,
  title = 'エラー',
  message,
  onDismiss,
  onRetry,
  retryEnabled = false,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>閉じる</Button>
          {retryEnabled && onRetry && (
            <Button mode="contained" onPress={onRetry}>
              再試行
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  // 必要に応じてスタイルを追加
});
