import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView, useColorScheme } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useTheme } from '../../ui/ThemeProvider';
import { useColors } from '../../constants/colors';
import { useStore } from '../../store';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Quote, Link, Image, ListChecks, Highlighter } from 'lucide-react-native';

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
  isDarkMode: propIsDarkMode, // Props経由のisDarkMode
  themeColors,
  onFocus,
  onBlur,
  placeholder = 'ここに内容を入力してください',
  autoFocus = false,
  onTextSelection,
}) => {
  const richText = useRef<RichEditor>(null);
  const { theme } = useTheme();
  const colors = useColors();
  const systemColorScheme = useColorScheme();

  // グローバルなテーマ設定から正確なダークモード状態を取得
  const globalTheme = useStore(state => state.theme);
  
  // 正確なダークモード状態を計算
  const calculatedIsDarkMode = 
    propIsDarkMode !== undefined 
      ? propIsDarkMode 
      : globalTheme === 'dark' || (globalTheme === 'system' && systemColorScheme === 'dark');
  
  const [selectedText, setSelectedText] = useState('');
  
  // ダークモード状態をログに出力して確認
  useEffect(() => {
    console.log('WebViewEditor: ダークモード状態確認:', {
      propIsDarkMode,
      globalTheme,
      systemColorScheme,
      calculatedIsDarkMode
    });
  }, [propIsDarkMode, globalTheme, systemColorScheme, calculatedIsDarkMode]);

  const editorStyle = {
    backgroundColor: calculatedIsDarkMode ? colors.background : colors.background,
    color: colors.text,
    placeholderColor: colors.gray,
  };

  const handleContentChange = (html: string) => {
    console.log("WebViewEditor: handleContentChange", html.substring(0, 100)); 
    onContentChange(html);
  };

  const handleSelectionChange = (data: { type: string; text: string; selection: any }) => {
    if (data.type === 'selection' && data.text) {
      setSelectedText(data.text); 
      if (onTextSelection) {
        onTextSelection(data.text);
      }
      console.log('WebViewEditor: テキスト選択:', data.text);
    }
  };

  // ハイライトスタイルの設定（文字色は常に黒にして視認性を確保）
  const getHighlightStyles = useCallback(() => {
    // ダークモード時は暗い黄色を使用し、文字色は常に黒にする
    return {
      bgColor: calculatedIsDarkMode ? '#FFB800' : 'yellow',
      textColor: 'black' // 常に黒で視認性を確保
    };
  }, [calculatedIsDarkMode]);

  // ハイライトスタイルを初期化する関数
  const initializeHighlightStyles = useCallback(() => {
    if (richText.current) {
      const { bgColor, textColor } = getHighlightStyles();
      const script = `
        (function() {
          try {
            // ハイライト用のグローバルCSS変数を設定
            document.documentElement.style.setProperty('--highlight-bg-color', '${bgColor}');
            document.documentElement.style.setProperty('--highlight-text-color', '${textColor}');
            
            // スタイルシートがなければ作成
            if (!document.getElementById('highlight-styles')) {
              const style = document.createElement('style');
              style.id = 'highlight-styles';
              style.textContent = 'span.highlight-text { background-color: var(--highlight-bg-color) !important; color: var(--highlight-text-color) !important; }';
              document.head.appendChild(style);
              console.log("FROM EDIT: ハイライトスタイル初期化: bgColor=" + '${bgColor}' + ", textColor=" + '${textColor}');
            } else {
              const style = document.getElementById('highlight-styles');
              style.textContent = 'span.highlight-text { background-color: var(--highlight-bg-color) !important; color: var(--highlight-text-color) !important; }';
              console.log("FROM EDIT: ハイライトスタイル更新: bgColor=" + '${bgColor}' + ", textColor=" + '${textColor}');
            }
          } catch (e) {
            console.error("FROM EDIT: ハイライトスタイル設定エラー", e);
          }
        })();
      `;
      richText.current.commandDOM(script);
    }
  }, [getHighlightStyles]);

  // ダークモード状態が変わったらハイライトスタイルを更新
  useEffect(() => {
    initializeHighlightStyles();
    console.log('WebViewEditor: ダークモード変更:', calculatedIsDarkMode);
  }, [calculatedIsDarkMode, initializeHighlightStyles]);

  const handleHighlight = () => {
    if (richText.current) {
      console.log('WebViewEditor: ハイライトボタン実行, isDarkMode:', calculatedIsDarkMode);
      
      // スタイルを取得
      const { bgColor, textColor } = getHighlightStyles();
      
      const script = `
        (function() {
          try {
            console.log("FROM EDIT: ハイライト実行: isDarkMode=${calculatedIsDarkMode}, bgColor=${bgColor}, textColor=${textColor}");
            const selection = window.getSelection();
            if (!selection.rangeCount) return false;
            
            const range = selection.getRangeAt(0);
            if (range.collapsed) {
              console.log('FROM EDIT: WebViewEditor: ハイライト - 選択範囲なし');
              return false;
            }

            const span = document.createElement('span');
            span.className = 'highlight-text'; // クラス名を使用
            span.style.backgroundColor = '${bgColor}'; // 直接スタイルも設定
            span.style.color = '${textColor}';
            
            try {
              range.surroundContents(span);
              console.log('FROM EDIT: WebViewEditor: ハイライト - surroundContents成功');
            } catch (e) {
              console.error('FROM EDIT: WebViewEditor: ハイライト - surroundContentsエラー:', e);
              const selectedHtml = range.toString();
              const highlightedHtml = '<span class="highlight-text" style="background-color: ${bgColor} !important; color: ${textColor} !important;">' + selectedHtml + '</span>';
              document.execCommand('insertHTML', false, highlightedHtml);
              console.log('FROM EDIT: WebViewEditor: ハイライト - insertHTML で代替実行');
            }
            
            selection.removeAllRanges(); 
          } catch (e) {
            console.error("FROM EDIT: ハイライト実行エラー", e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(script);
    } else {
      console.log('WebViewEditor: richText.current がありません');
    }
  };

  useEffect(() => {
    if (autoFocus && richText.current && !readOnly) {
      setTimeout(() => {
        richText.current?.focusContentEditor();
      }, 300);
    }
  }, [autoFocus, readOnly]);
  
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
    [actions.blockquote]: ({ tintColor }: { tintColor?: string }) => <Quote size={20} color={tintColor || colors.text} />,
    [actions.checkboxList]: ({ tintColor }: { tintColor?: string }) => <ListChecks size={20} color={tintColor || colors.text} />,
    ['highlight']: ({ tintColor }: { tintColor?: string }) => <Highlighter size={20} color={tintColor || colors.text} />,
  };

  const customActions = {
    highlight: handleHighlight, 
  };
  
  const editorActions = [
    actions.heading1, actions.heading2, actions.heading3, actions.blockquote,
    actions.setBold, actions.setItalic, actions.setUnderline, actions.setStrikethrough,
    'highlight', 
    actions.insertOrderedList, actions.insertBulletsList, actions.checkboxList,
    actions.insertLink,
  ];

  const handleEditorInitialized = () => {
    console.log('WebViewEditor: RichEditor initialized, isDarkMode:', calculatedIsDarkMode);
    if (richText.current) {
      if (content === undefined || content === null || content.trim() === '') {
         console.log('WebViewEditor: 初期コンテンツが空のため、空のHTMLをセット');
         richText.current.setContentHTML('');
      } else {
         console.log('WebViewEditor: 初期コンテンツをセット:', content.substring(0,100));
         richText.current.setContentHTML(content);
      }
      
      // 選択イベントのリスナー設定
      const script = `
        document.addEventListener('selectionchange', function() {
          const selection = window.getSelection();
          if (selection && window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'selection',
              text: selection.toString(),
              selection: { 
                  anchorNode: selection.anchorNode ? selection.anchorNode.nodeName : null,
                  anchorOffset: selection.anchorOffset,
                  focusNode: selection.focusNode ? selection.focusNode.nodeName : null,
                  focusOffset: selection.focusOffset,
                  isCollapsed: selection.isCollapsed,
                  rangeCount: selection.rangeCount
              }
            }));
          }
        });
        true; 
      `;
      richText.current.commandDOM(script);
      
      // ハイライトスタイルの初期化
      initializeHighlightStyles();
    }
  };

  const androidSpecificProps = Platform.OS === 'android' ? {
    originWhitelist: ['*'] as string[],
    domStorageEnabled: true,
    javaScriptEnabled: true,
    overScrollMode: 'never' as OverScrollModeType,
    allowFileAccess: true,
    cacheEnabled: true,
    hideKeyboardAccessoryView: false,
    autoFocus: false,
  } : {};

  const iosSpecificProps = Platform.OS === 'ios' ? {
    useContainer: true,
    initialFocus: autoFocus,
    allowsInlineMediaPlayback: true,
    hideKeyboardAccessoryView: false,
    bounces: false,
  } : {};

  useEffect(() => {
    if (__DEV__) {
      console.log('WebViewEditor Props:', { 
        Platform: Platform.OS, 
        readOnly, 
        autoFocus, 
        propIsDarkMode,
        globalTheme,
        systemColorScheme,
        calculatedIsDarkMode
      });
    }
  }, [readOnly, autoFocus, propIsDarkMode, globalTheme, systemColorScheme, calculatedIsDarkMode]);

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
          style={[styles.toolbar, { backgroundColor: calculatedIsDarkMode ? colors.card : colors.lightGray }]}
          itemStyle={{ paddingHorizontal: 10 }}
          iconSize={20}
          onPressAddImage={() => { console.log("WebViewEditor: onPressAddImage"); }} 
          onInsertLink={() => { console.log("WebViewEditor: onInsertLink"); }} 
          highlight={handleHighlight}
        />
      )}
      <RichEditor
        ref={richText}
        initialContentHTML={content || ''} 
        onChange={handleContentChange}
        style={styles.editor} 
        editorStyle={editorStyle}
        disabled={readOnly}
        onFocus={() => { console.log("WebViewEditor: onFocus"); if(onFocus) onFocus(); }}
        onBlur={() => { console.log("WebViewEditor: onBlur"); if(onBlur) onBlur(); }}
        placeholder={placeholder}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        editorInitializedCallback={handleEditorInitialized}
        onMessage={(event) => {
          try {
            const messageData = event.data; 
            if (messageData && typeof messageData === 'string') {
              const parsedData = JSON.parse(messageData);
              console.log("WebViewEditor: onMessage parsedData:", parsedData);
              if (parsedData.type === 'selection') {
                handleSelectionChange(parsedData);
              } else if (parsedData.type === 'contentChange') {
                console.log("WebViewEditor: onMessage contentChange from WebView:", parsedData.data.substring(0,100));
              }
            }
          } catch (e) {
            console.error('WebViewEditor: メッセージ解析エラー:', e, "受信データ:", event.data); 
          }
        }}
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