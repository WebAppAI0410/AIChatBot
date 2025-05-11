import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useColors from '../constants/colors';

export default function NotesScreen() {
  const colors = useColors(); // 動的カラーを取得
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.background,
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
    <View style={styles.container}>
      <Text style={styles.title}>Notes Screen</Text>
      <Text style={styles.description}>
        This screen will display saved notes from chat conversations.
      </Text>
    </View>
  );
}
