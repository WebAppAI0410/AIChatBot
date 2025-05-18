import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useTheme } from '../../ui/ThemeProvider';
import { useColors } from '../../constants/colors';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Pilcrow, Heading1, Heading2, Heading3, Quote, Link, Image, Trash } from 'lucide-react-native';

// WebViewとRichEditorの型定義
type DataDetectorTypes = 'phoneNumber' | 'link' | 'address' | 'calendarEvent' | 'none' | 'trackingNumber' | 'flightNumber';
type OverScrollModeType = 'always' | 'content' | 'never';

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
  onTextSelection?: (selectedText: string) => void;
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
  onTextSelection,
}) => {
  const richText = useRef<RichEditor>(null);
  const { theme } = useTheme();
  const colors = useColors();

  // エディタスタイル定義（プラットフォーム固有の設定を避ける）
  const editorStyle = {
    backgroundColor: isDarkMode ? colors.background : colors.background,
    color: colors.text,
    placeholderColor: colors.gray,
  };

  const handleContentChange = (html: string) => {
    onContentChange(html);
  };

  // テキスト選択ハンドラ
  const handleSelectionChange = (data: { type: string; text: string }) => {
    if (data.type === 'selection' && data.text && onTextSelection) {
      onTextSelection(data.text);
    }
  };

  // 初期フォーカス設定
  useEffect(() => {
    if (autoFocus && richText.current && !readOnly) {
      setTimeout(() => {
        richText.current?.focusContentEditor();
      }, 300);
    }
  }, [autoFocus, readOnly]);
  
  // ツールバーアイコン定義
  const customIconMap = {
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

  // プラットフォームごとにツールバーアクションを定義
  // iOS - 完全な機能セット
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

  // Android - 簡素化したセット（安定性のため）
  const editorActionsForAndroid = [
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

  // プラットフォームに応じたアクション配列
  const editorActions = Platform.OS === 'ios' 
    ? editorActionsForIOS 
    : editorActionsForAndroid;

  // Androidに特化したWebViewプロパティの設定
  const androidSpecificProps = Platform.OS === 'android' ? {
    // 型エラー回避のために明示的に配列と指定
    // dataDetectorTypes: ['none'] as DataDetectorTypes[],
    originWhitelist: ['*'] as string[],
    // その他のAndroid固有の設定
    domStorageEnabled: true,
    javaScriptEnabled: true,
    overScrollMode: 'never' as OverScrollModeType,
    allowFileAccess: true,
    cacheEnabled: true,
    // キーボード関連の設定
    hideKeyboardAccessoryView: false,
    autoFocus: false, // Androidでは手動フォーカス処理を使用
  } : {};

  // iOS固有のプロパティ
  const iosSpecificProps = Platform.OS === 'ios' ? {
    useContainer: true,
    initialFocus: autoFocus,
    allowsInlineMediaPlayback: true,
    hideKeyboardAccessoryView: false,
    bounces: false,
  } : {};

  // デバッグログ - 開発時にプロパティの型を確認
  useEffect(() => {
    if (__DEV__ && Platform.OS === 'android') {
      console.log('WebViewEditor Android Props:', {
        // その他のデバッグ情報
      });
    }
  }, []);

  // Android向けに編集内容のコンテキストメニューをカスタマイズするJavaScript
  const customInjectJavaScript = `
    if (window.ReactNativeWebView) {
      document.addEventListener('selectionchange', function() {
        const selection = window.getSelection();
        if (selection && selection.toString()) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'selection',
            text: selection.toString()
          }));
        }
      });
    }
    true;
  `;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      {!readOnly && (
        <RichToolbar
          editor={richText}
          actions={editorActions}
          iconMap={customIconMap}
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
        disabled={readOnly}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        editorInitializedCallback={() => {
          console.log('RichEditor initialized');
        }}
        // テキスト選択処理
        onMessage={(event) => {
          try {
            const parsedData = JSON.parse(event.data);
            handleSelectionChange(parsedData);
          } catch (e) {
            console.log('メッセージ解析エラー:', e);
          }
        }}
        // インジェクトJavaScriptを追加
        injectedJavaScript={customInjectJavaScript}
        // プラットフォーム固有の設定を適用
        {...androidSpecificProps}
        {...iosSpecificProps}
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