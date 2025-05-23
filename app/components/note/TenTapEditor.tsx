import React, { forwardRef, useImperativeHandle, useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Platform, SafeAreaView, KeyboardAvoidingView, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { 
  RichText, 
  Toolbar, 
  useEditorBridge, 
  TenTapStartKit, 
  CoreBridge,
  PlaceholderBridge,
  useBridgeState,
  DEFAULT_TOOLBAR_ITEMS,
  type ToolbarItem
} from '@10play/tentap-editor';
import { useColors } from '../../constants/colors';

export type TenTapEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  onTextSelection?: (selectedText: string) => void;
  isDarkMode?: boolean;
  themeColors?: any;
};

const TenTapEditor = forwardRef<{ 
  editor: any,
  undo: () => void, 
  redo: () => void,
}, TenTapEditorProps>((props, ref) => {
  const {
    content,
    onContentChange,
    readOnly = false,
    autoFocus = false,
    placeholder = 'ここに内容を入力してください',
    isDarkMode = false,
    themeColors,
    onTextSelection,
  } = props;

  const colors = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // 動的スタイルを生成
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    editor: {
      flex: 1,
      paddingHorizontal: 0,
    },
    keyboardAvoidingView: {
      position: 'absolute',
      width: '100%',
      bottom: 0,
    },
    headingToolbar: {
      paddingVertical: isTablet ? 12 : 8,
      paddingHorizontal: isTablet ? 16 : 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
    },
    standardToolbar: {
      paddingVertical: isTablet ? 8 : 4,
      paddingHorizontal: isTablet ? 12 : 8,
      borderTopWidth: 1,
    },
    headingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isTablet ? 8 : 4,
      justifyContent: 'space-between',
    },
    headingButton: {
      paddingHorizontal: isTablet ? 12 : 6,
      paddingVertical: isTablet ? 12 : 8,
      borderRadius: isTablet ? 8 : 6,
      borderWidth: 1,
      alignItems: 'center',
      flex: 1,
      marginHorizontal: isTablet ? 2 : 1,
      minHeight: isTablet ? 44 : 36,
    },
    headingButtonText: {
      textAlign: 'center',
      flexShrink: 1,
    },
  });

  // ダークモード対応のカスタムCSS
  const customCSS = `
    * {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      box-sizing: border-box;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      background-color: ${isDarkMode ? '#0d1117' : '#ffffff'} !important;
      color: ${isDarkMode ? '#c9d1d9' : '#24292f'} !important;
    }
    
    body {
      padding: 16px;
      font-size: 16px;
      background-color: ${isDarkMode ? '#0d1117' : '#ffffff'} !important;
      color: ${isDarkMode ? '#c9d1d9' : '#24292f'} !important;
    }
    
    .ProseMirror {
      outline: none;
      min-height: 200px;
      background-color: ${isDarkMode ? '#0d1117' : '#ffffff'} !important;
      color: ${isDarkMode ? '#c9d1d9' : '#24292f'} !important;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
      color: ${isDarkMode ? '#f0f6fc' : '#24292f'} !important;
    }
    
    h1 {
      font-size: 2em;
      border-bottom: 1px solid ${isDarkMode ? '#21262d' : '#eaecef'};
      padding-bottom: 8px;
    }
    
    h2 {
      font-size: 1.5em;
      border-bottom: 1px solid ${isDarkMode ? '#21262d' : '#eaecef'};
      padding-bottom: 8px;
    }
    
    h3 {
      font-size: 1.25em;
    }
    
    h4 {
      font-size: 1em;
    }
    
    h5 {
      font-size: 0.875em;
    }
    
    h6 {
      font-size: 0.85em;
      color: ${isDarkMode ? '#8b949e' : '#656d76'} !important;
    }
    
    p {
      margin-bottom: 16px;
      color: ${isDarkMode ? '#c9d1d9' : '#24292f'} !important;
    }
    
    blockquote {
      padding: 0 1em;
      color: ${isDarkMode ? '#8b949e' : '#656d76'} !important;
      border-left: 0.25em solid ${isDarkMode ? '#30363d' : '#d0d7de'};
      margin: 0 0 16px 0;
    }
    
    ul, ol {
      margin-bottom: 16px;
      padding-left: 2em;
      color: ${isDarkMode ? '#c9d1d9' : '#24292f'} !important;
    }
    
    li {
      margin-bottom: 4px;
      color: ${isDarkMode ? '#c9d1d9' : '#24292f'} !important;
    }
    
    code {
      padding: 0.2em 0.4em;
      font-size: 85%;
      background-color: ${isDarkMode ? '#262c36' : '#f6f8fa'} !important;
      color: ${isDarkMode ? '#e6edf3' : '#24292f'} !important;
      border-radius: 6px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    
    pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: ${isDarkMode ? '#161b22' : '#f6f8fa'} !important;
      color: ${isDarkMode ? '#e6edf3' : '#24292f'} !important;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    
    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 8px 0;
    }
    
    .ProseMirror p.is-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: ${isDarkMode ? '#6e7681' : '#8c959f'} !important;
      pointer-events: none;
      height: 0;
    }
    
    .ProseMirror-focused {
      outline: none;
    }
    
    /* 選択時のスタイル */
    ::selection {
      background-color: ${isDarkMode ? '#264f78' : '#0969da'} !important;
      color: ${isDarkMode ? '#ffffff' : '#ffffff'} !important;
    }
    
    /* リンクのスタイル */
    a {
      color: ${isDarkMode ? '#58a6ff' : '#0969da'} !important;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    /* テーブルのスタイル */
    table {
      border-collapse: collapse;
      margin: 16px 0;
      overflow-x: auto;
    }
    
    table th,
    table td {
      padding: 6px 13px;
      border: 1px solid ${isDarkMode ? '#30363d' : '#d0d7de'};
      color: ${isDarkMode ? '#c9d1d9' : '#24292f'} !important;
    }
    
    table th {
      font-weight: 600;
      background-color: ${isDarkMode ? '#21262d' : '#f6f8fa'} !important;
    }
    
    /* 水平線のスタイル */
    hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: ${isDarkMode ? '#30363d' : '#d0d7de'} !important;
      border: 0;
    }
  `;

  // ダークモード対応のカスタムテーマ
  const customTheme = {
    toolbar: {
      toolbarBody: {
        backgroundColor: isDarkMode ? '#21262d' : '#f6f8fa',
        borderTopColor: isDarkMode ? '#30363d' : '#d0d7de',
        borderBottomColor: isDarkMode ? '#30363d' : '#d0d7de',
      },
    },
    webview: {
      backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
    },
    webviewContainer: {
      backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
    },
  };

  // コンテンツ更新の制御用
  const [isUpdatingFromExternal, setIsUpdatingFromExternal] = useState(false);
  const lastInternalContent = useRef(content);
  
  // TenTapエディタブリッジを初期化
  const editor = useEditorBridge({
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(customCSS),
      PlaceholderBridge.configureExtension({
        placeholder: placeholder,
        showOnlyCurrent: false,
      }),
    ],
    initialContent: content || '<p></p>',
    autofocus: autoFocus,
    avoidIosKeyboard: true,
    editable: !readOnly,
    theme: customTheme,
    onChange: () => {
      // 外部からの更新中は onChange を無視
      if (isUpdatingFromExternal) {
        return;
      }
      
      editor.getHTML().then((html) => {
        if (html !== lastInternalContent.current) {
          lastInternalContent.current = html;
          onContentChange(html);
        }
      });
    },
  });

  // エディタの状態を取得
  const editorState = useBridgeState(editor);

  // Undo/RedoとHeading（Aa）ボタンを除外したカスタムツールバーアイテム
  const customToolbarItems: ToolbarItem[] = DEFAULT_TOOLBAR_ITEMS.filter(
    (item, index) => {
      // 最後の2つ（Undo/Redo）と見出し選択（Heading）を除外
      return index < DEFAULT_TOOLBAR_ITEMS.length - 2 && index !== 4; // インデックス4が見出し選択
    }
  );

  // カスタムツールバーボタン（見出し用）
  const HeadingToolbarButton = ({ 
    title, 
    active, 
    onPress, 
    fontSize, 
    fontWeight 
  }: { 
    title: string; 
    active: boolean; 
    onPress: () => void;
    fontSize: number;
    fontWeight: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.headingButton,
        { 
          backgroundColor: active ? colors.primary : 'transparent',
          borderColor: colors.border
        }
      ]}
      onPress={onPress}
    >
      <Text 
        style={[
          styles.headingButtonText,
          { 
            color: active ? colors.textOnPrimary : (isDarkMode ? '#c9d1d9' : '#24292f'),
            fontSize,
            fontWeight: fontWeight as any,
          }
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // 見出しボタンのハンドラ
  const handleHeading = useCallback((level: number) => {
    if (editor && editor.toggleHeading) {
      editor.toggleHeading(level as 1 | 2 | 3 | 4 | 5 | 6);
    }
  }, [editor]);

  // 段落（プレーンテキスト）ボタンのハンドラ
  const handleParagraph = useCallback(() => {
    if (editor && editor.setParagraph) {
      editor.setParagraph();
    }
  }, [editor]);

  // 見出し選択ツールバーコンポーネント
  const HeadingToolbar = () => {
    return (
      <View style={[styles.headingToolbar, { 
        backgroundColor: isDarkMode ? '#161b22' : '#f8f9fa',
        borderTopColor: isDarkMode ? '#30363d' : '#d0d7de',
        borderBottomColor: isDarkMode ? '#30363d' : '#d0d7de'
      }]}>
        <View style={styles.headingRow}>
          <HeadingToolbarButton
            title="本文"
            fontSize={14}
            fontWeight="400"
            active={!editorState?.headingLevel}
            onPress={handleParagraph}
          />
          <HeadingToolbarButton
            title="大見出し"
            fontSize={18}
            fontWeight="600"
            active={editorState?.headingLevel === 1}
            onPress={() => handleHeading(1)}
          />
          <HeadingToolbarButton
            title="中見出し"
            fontSize={16}
            fontWeight="600"
            active={editorState?.headingLevel === 2}
            onPress={() => handleHeading(2)}
          />
          <HeadingToolbarButton
            title="小見出し"
            fontSize={14}
            fontWeight="600"
            active={editorState?.headingLevel === 3}
            onPress={() => handleHeading(3)}
          />
        </View>
      </View>
    );
  };

  // 親コンポーネントから参照できるようにする
  useImperativeHandle(ref, () => ({
    editor,
    undo: () => {
      editor.undo();
    },
    redo: () => {
      editor.redo();
    },
  }));

  // コンテンツが外部から変更された場合の同期
  useEffect(() => {
    if (content && editor && content !== lastInternalContent.current) {
      setIsUpdatingFromExternal(true);
      
      editor.getHTML().then((currentHTML) => {
        if (currentHTML !== content) {
          editor.setContent(content);
          lastInternalContent.current = content;
        }
        // 短い遅延後に外部更新フラグをリセット
        setTimeout(() => {
          setIsUpdatingFromExternal(false);
        }, 100);
      });
    }
  }, [content, editor]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0d1117' : '#ffffff' }]}>
      <RichText 
        editor={editor} 
        style={[styles.editor, { backgroundColor: isDarkMode ? '#0d1117' : '#ffffff' }]} 
      />

      {!readOnly && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          {/* 見出し選択ツールバー */}
          <HeadingToolbar />
          
          {/* 標準ツールバー */}
          <View style={[styles.standardToolbar, { 
            backgroundColor: isDarkMode ? '#21262d' : '#f6f8fa',
            borderTopColor: isDarkMode ? '#30363d' : '#d0d7de'
          }]}>
            <Toolbar 
              editor={editor} 
              items={customToolbarItems}
              shouldHideDisabledToolbarItems={true}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
});

TenTapEditor.displayName = 'TenTapEditor';

export default TenTapEditor; 