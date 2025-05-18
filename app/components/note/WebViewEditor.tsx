import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useTheme } from '../../ui/ThemeProvider'; // ThemeProviderからテーマを取得
import { useColors } from '../../constants/colors'; // useColorsフックを使用
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Pilcrow, Heading1, Heading2, Heading3, Quote, Link, Image, Trash } from 'lucide-react-native';

export type WebViewEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  readOnly?: boolean;
  isDarkMode?: boolean; // isDarkModeプロパティを追加
  themeColors?: any; // themeColorsプロパティはオプションとして残す
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean; // オートフォーカスプロパティ追加
};

const WebViewEditor: React.FC<WebViewEditorProps> = ({
  content,
  onContentChange,
  readOnly = false,
  isDarkMode = false, // isDarkModeをpropsから受け取る
  themeColors,
  onFocus,
  onBlur,
  placeholder = 'ここに内容を入力してください...',
  autoFocus = false, // デフォルトはfalse
}) => {
  const richText = useRef<RichEditor>(null);
  const { theme } = useTheme(); // ThemeProviderからテーマを取得
  const colors = useColors(); // useColorsフックを使用

  // Pell Rich Editorのテーマカラー設定
  const editorStyle = {
    backgroundColor: isDarkMode ? colors.background : colors.background, // 背景色
    color: isDarkMode ? colors.text : colors.text, // テキスト色
    placeholderColor: isDarkMode ? colors.gray : colors.gray, // プレースホルダー色
    // caretColor: isDarkMode ? colors.primary : colors.primary, // キャレット色 (Pellでは直接指定不可の場合がある)
    // contentCSSText: `body { caret-color: ${isDarkMode ? colors.primary : colors.primary}; }`, // キャレットカラーをCSSで試みる
  };

  const handleContentChange = (html: string) => {
    onContentChange(html);
  };

  useEffect(() => {
    if (autoFocus && richText.current && !readOnly) {
      // 少し遅延させてフォーカスを試みる
      setTimeout(() => {
        richText.current?.focusContentEditor();
      }, 100);
    }
  }, [autoFocus, readOnly]);

  // カスタムアイコンの定義
  const iconMap = {
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
    // [actions.insertBlockquote]: ({ tintColor }: { tintColor?: string }) => <Quote size={20} color={tintColor || colors.text} />, // 一旦コメントアウト
    // 他の必要なアクションも同様に追加
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // ヘッダーの高さを考慮
    >
      {!readOnly && (
        <RichToolbar
          editor={richText}
          actions={[
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
          ]}
          iconMap={iconMap}
          selectedIconTint={colors.primary} // 選択時のアイコン色
          unselectedIconTint={colors.text} // 非選択時のアイコン色
          style={[styles.toolbar, { backgroundColor: isDarkMode ? colors.card : colors.lightGray }]} // backgroundSecondary を card に変更 (または存在する色に)
          itemStyle={{ paddingHorizontal: Platform.OS === 'ios' ? 8 : 10 }} // アイコン間のパディング調整
        />
      )}
      <RichEditor
        ref={richText}
        initialContentHTML={content}
        onChange={handleContentChange}
        style={styles.editor}
        editorStyle={editorStyle}
        useContainer={Platform.OS !== 'android'} // Androidではfalseを推奨、iOSではtrueも可
        disabled={readOnly}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        initialFocus={autoFocus} // 初期フォーカス
        editorInitializedCallback={() => {
          if (autoFocus && richText.current && !readOnly) {
            richText.current?.focusContentEditor();
          }
        }}
        // WebView固有のプロパティ (必要に応じて調整)
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
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