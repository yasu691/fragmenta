import React from 'react';
import { Portal, Dialog, Button, Text } from 'react-native-paper';

interface DialogAction {
  text: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ChoiceDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  actions: DialogAction[];
}

export const ChoiceDialog: React.FC<ChoiceDialogProps> = ({
  visible,
  title,
  message,
  onDismiss,
  actions,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>キャンセル</Button>
          {actions.map((action, index) => (
            <Button
              key={index}
              onPress={() => {
                action.onPress();
                onDismiss();
              }}
              textColor={action.destructive ? '#dc3545' : undefined}
            >
              {action.text}
            </Button>
          ))}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
