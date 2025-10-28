import React from 'react';
import { Portal, Dialog, Button, Text } from 'react-native-paper';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  onDismiss,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'キャンセル',
  confirmDestructive = false,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{cancelText}</Button>
          <Button
            onPress={() => {
              onConfirm();
              onDismiss();
            }}
            textColor={confirmDestructive ? '#dc3545' : undefined}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
