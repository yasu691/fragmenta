import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { PaperProvider, TextInput, Button, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    // 処理ロジックは未実装
    console.log('Submit button pressed');
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={MD3LightTheme}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <View style={styles.content}>
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
              >
                送信
              </Button>
            </View>
          </KeyboardAvoidingView>
          <StatusBar style="auto" />
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

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
    gap: 16,
  },
  textInput: {
    backgroundColor: '#ffffff',
    minHeight: 150,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
