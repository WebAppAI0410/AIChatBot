import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useTheme } from '../../ui/ThemeProvider';
import { useColors } from '../../constants/colors';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Pilcrow, Heading1, Heading2, Heading3, Quote, Link, Image, Trash } from 'lucide-react-native';

export type WebViewEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  readOnly?: boolean;
  isDarkMode?: boolean;
  themeColors?: any;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

const WebViewEditor: React.FC<WebViewEditorProps> = ({
  content,
  onContentChange,
  readOnly = false,
  isDarkMode = false,
  themeColors,
  onFocus,
  onBlur,
  placeholder = 'ここに内容を入力してください...',
  autoFocus = false,
}) => {
  const richText = useRef<RichEditor>(null);
  const { theme } = useTheme();
  const colors = useColors();

  const editorStyleForAndroid = {
    color: isDarkMode ? colors.text : colors.text,
    placeholderColor: isDarkMode ? colors.gray : colors.gray,
  };
  const editorStyleForIOS = {
    backgroundColor: isDarkMode ? colors.background : colors.background,
    color: isDarkMode ? colors.text : colors.text,
    placeholderColor: isDarkMode ? colors.gray : colors.gray,
  };
  const editorStyle = Platform.select({
    ios: editorStyleForIOS,
    android: editorStyleForAndroid,
  });

  const handleContentChange = (html: string) => {
    onContentChange(html);
  };

  useEffect(() => {
    if (autoFocus && richText.current && !readOnly) {
      setTimeout(() => {
        richText.current?.focusContentEditor();
      }, 100);
    }
  }, [autoFocus, readOnly]);
  
  const iconMapForIOS = {
    [actions.setBold]: ({ tintColor }: { tintColor?: string }) => <Bold size={20} color={tintColor || colors.text} />,
    [actions.setItalic]: ({ tintColor }: { tintColor?: string }) => <Italic size={20} color={tintColor || colors.text} />,
    [actions.setUnderline]: ({ tintColor }: { tintColor?: string }) => <Underline size={20} color={tintColor || colors.text} />,
    [actions.setStrikethrough]: ({ tintColor }: { tintColor?: string }) => <Strikethrough size={20} color={tintColor || colors.text} />,
    [actions.insertOrderedList]: ({ tintColor }: { tintColor?: string }) => <ListOrdered size={20} color={tintColor || colors.text} />,
    [actions.insertBulletsList]: ({ tintColor }: { tintColor?: string }) => <List size={20} color={tintColor || colors.text} />,
    [actions.heading1]: ({ tintColor }: { tintColor?: string }) => <Heading1 size={20} color={tintColor || colors.text} />,
    [actions.heading2]: ({ tintColor }: { tintColor?: string }) => <Heading2 size={20} color={tintColor || colors.text} />,
    [actions.heading3]: ({ tintColor }: { tintColor?: string }) => <Heading3 size={20} color={tintColor || colors.text} />,
    [actions.insertLink]: ({ tintColor }: { tintColor?: string }) => <Link size={20} color={tintColor || colors.text} />,
    [actions.insertImage]: ({ tintColor }: { tintColor?: string }) => <Image size={20} color={tintColor || colors.text} />,
    [actions.removeFormat]: ({ tintColor }: { tintColor?: string }) => <Trash size={20} color={tintColor || colors.text} />,
    [actions.setParagraph]: ({ tintColor }: { tintColor?: string }) => <Pilcrow size={20} color={tintColor || colors.text} />,
  };

  // Androidでも正しく動作するようにするために、確実に配列を返すようにする
  const editorActionsForIOS = [
    actions.setBold,
    actions.setItalic,
    actions.setUnderline,
    actions.setStrikethrough,
    actions.insertOrderedList,
    actions.insertBulletsList,
    actions.heading1,
    actions.heading2,
    actions.heading3,
    actions.insertLink,
    actions.removeFormat,
    actions.setParagraph,
  ];

  const editorActionsForAndroid = [
    actions.setBold, 
    actions.setItalic,
    actions.setUnderline,
  ];

  // Platform.selectを使わず、明示的に条件分岐させて確実に配列を返す
  const editorActions = Platform.OS === 'ios' 
    ? editorActionsForIOS 
    : editorActionsForAndroid;

  // AndroidではiconMapを渡さない (デフォルトアイコンにフォールバックさせる)
  const iconMap = Platform.OS === 'ios' ? iconMapForIOS : undefined;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      {!readOnly && (
        <RichToolbar
          editor={richText}
          actions={editorActions} // 必ず配列型になるように修正
          iconMap={iconMap}
          selectedIconTint={colors.primary}
          unselectedIconTint={colors.text}
          style={[styles.toolbar, { backgroundColor: isDarkMode ? colors.card : colors.lightGray }]}
          itemStyle={{ paddingHorizontal: Platform.OS === 'ios' ? 8 : 10 }}
        />
      )}
      <RichEditor
        ref={richText}
        initialContentHTML={content || ''}
        onChange={handleContentChange}
        style={styles.editor} 
        editorStyle={editorStyle}
        useContainer={Platform.OS === 'ios'} 
        disabled={readOnly}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        initialFocus={Platform.OS === 'ios' ? autoFocus : false}
        editorInitializedCallback={() => {
          if (autoFocus && richText.current && !readOnly && Platform.OS === 'ios') {
            richText.current?.focusContentEditor();
          }
        }}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        dataDetectorTypes={['none']}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c6c6c8',
  },
  editor: {
    flex: 1,
  },
});

export default WebViewEditor; 