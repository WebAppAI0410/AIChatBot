import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import useColors from '../constants/colors';
import Header from '../components/Header';
import theme from '../ui/theme';

export default function NotesScreen() {
  const colors = useColors(); // 動的カラーを取得
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      color: colors.text, // テキスト色も適切に設定
    },
    description: {
      fontSize: 16,
      textAlign: 'center',
      color: colors.secondaryText, // よりダークモードに適した色に変更
    },
  });
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <SafeAreaView style={styles.container}>
        <Header
          title="ノート"
          showBack={false}
          onTitleEdit={undefined}
        />
        
        <View style={styles.content}>
          <Text style={styles.title}>Notes Screen</Text>
          <Text style={styles.description}>
            This screen will display saved notes from chat conversations.
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
