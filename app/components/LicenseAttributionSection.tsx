import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import useColors from '../constants/colors';

export const LicenseAttributionSection = () => {
  const colors = useColors();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, {color: colors.text}]}>
        ライセンス情報
      </Text>
      
      {/* Qwen3必須アトリビューション */}
      <View style={[styles.attributionCard, {backgroundColor: colors.card}]}>
        <Text style={[styles.modelName, {color: colors.text}]}>
          Qwen3-4B
        </Text>
        <Text style={[styles.attributionText, {color: colors.secondaryText}]}>
          このアプリはAlibabaが開発したQwen3モデルを使用しています。
        </Text>
        <Text style={[styles.licenseText, {color: colors.secondaryText}]}>
          ライセンス: Qwen3 License Agreement
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://huggingface.co/Qwen/Qwen3-4B-GGUF')}
        >
          <Text style={[styles.link, {color: colors.primary}]}>
            https://huggingface.co/Qwen/Qwen3-4B-GGUF
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  attributionCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  attributionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  licenseText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  link: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LicenseAttributionSection; 