import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import useColors from '../../constants/colors';

interface CodeBlockProps {
  code: string;
  language?: string;
  isDarkMode?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language = '', 
  isDarkMode = false 
}) => {
  const colors = useColors();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDarkMode ? '#161b22' : '#f6f8fa',
        borderColor: isDarkMode ? '#30363d' : '#d0d7de',
      }
    ]}>
      {language && (
        <View style={[
          styles.languageHeader,
          {
            backgroundColor: isDarkMode ? '#21262d' : '#eaeef2',
            borderBottomColor: isDarkMode ? '#30363d' : '#d0d7de',
          }
        ]}>
          <Text style={[
            styles.languageText,
            { color: isDarkMode ? '#8b949e' : '#656d76' }
          ]}>
            {language}
          </Text>
        </View>
      )}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        style={styles.scrollView}
      >
        <Text style={[
          styles.codeText,
          { color: isDarkMode ? '#e6edf3' : '#24292f' }
        ]}>
          {code}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  languageHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  scrollView: {
    maxHeight: 300,
  },
  codeText: {
    fontFamily: 'Courier New, monospace',
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    minWidth: '100%',
  },
});

export default CodeBlock;