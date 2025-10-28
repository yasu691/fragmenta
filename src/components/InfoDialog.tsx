import React from 'react';
import { Portal, Dialog, Button, Text } from 'react-native-paper';

interface InfoDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  confirmText?: string;
}

export const InfoDialog: React.FC<InfoDialogProps> = ({
  visible,
  title,
  message,
  onDismiss,
  confirmText = 'OK',
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{confirmText}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
