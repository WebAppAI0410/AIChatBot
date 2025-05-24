import React, { forwardRef, useImperativeHandle, useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Platform, SafeAreaView, KeyboardAvoidingView, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { Calculator, Minus, Code, Hash, MessageCircle } from 'lucide-react-native';
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
  isNewNote?: boolean;
};

interface TenTapEditorRef {
  editor: any;
  undo: () => void;
  redo: () => void;
}

const TenTapEditor: React.ForwardRefRenderFunction<TenTapEditorRef, TenTapEditorProps> = (props, ref) => {
  const {
    content,
    onContentChange,
    readOnly = false,
    autoFocus = false,
    placeholder = 'ここに内容を入力してください',
    isDarkMode = false,
    themeColors,
    onTextSelection,
    isNewNote = false,
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
    inlineToolbar: {
      paddingVertical: isTablet ? 8 : 6,
      paddingHorizontal: isTablet ? 12 : 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
    },
    extendedToolbar: {
      paddingVertical: isTablet ? 8 : 6,
      paddingHorizontal: isTablet ? 12 : 8,
      borderTopWidth: 1,
    },
    inlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isTablet ? 6 : 3,
      justifyContent: 'space-around',
    },
    extendedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isTablet ? 8 : 4,
      justifyContent: 'space-around',
    },
    extendedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 8 : 6,
      paddingVertical: isTablet ? 8 : 6,
      borderRadius: isTablet ? 6 : 4,
      borderWidth: 1,
      flex: 1,
      marginHorizontal: isTablet ? 2 : 1,
      minHeight: isTablet ? 36 : 32,
      gap: 4,
    },
    extendedButtonText: {
      fontSize: isTablet ? 12 : 10,
      fontWeight: '500',
      textAlign: 'center',
      flexShrink: 1,
    },
  });

  // ダークモード対応のカスタムCSS
  const customCSS = `
    * {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
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
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
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

    /* 数学ブロックのスタイル */
    .math-block {
      background-color: ${isDarkMode ? '#0d1117' : '#ffffff'} !important;
      border: 2px solid ${isDarkMode ? '#30363d' : '#d0d7de'} !important;
      border-radius: 6px;
      padding: 12px;
      margin: 8px 0;
      font-family: "Courier New", monospace;
      font-size: 16px;
      color: ${isDarkMode ? '#c9d1d9' : '#24292f'} !important;
      text-align: center;
      position: relative;
    }

    .math-block:before {
      content: 'LaTeX';
      position: absolute;
      top: 4px;
      right: 8px;
      font-size: 10px;
      color: ${isDarkMode ? '#8b949e' : '#656d76'} !important;
      font-weight: bold;
      text-transform: uppercase;
    }

    /* インライン数式のスタイル */
    .math-inline {
      background-color: ${isDarkMode ? '#21262d' : '#f6f8fa'} !important;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: "Courier New", monospace;
      border: 1px solid ${isDarkMode ? '#30363d' : '#d0d7de'};
    }

    /* インラインコードのスタイル */
    .code-inline {
      background-color: ${isDarkMode ? '#262c36' : '#f6f8fa'} !important;
      color: ${isDarkMode ? '#e6edf3' : '#24292f'} !important;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: "Courier New", monospace;
      border: 1px solid ${isDarkMode ? '#30363d' : '#d0d7de'};
    }

    /* インラインコメントのスタイル */
    .comment-inline {
      background-color: ${isDarkMode ? '#1a1f2e' : '#fff8e1'} !important;
      color: ${isDarkMode ? '#8b949e' : '#9e6a03'} !important;
      padding: 2px 4px;
      border-radius: 3px;
      font-style: italic;
      border: 1px solid ${isDarkMode ? '#30363d' : '#d0d7de'};
    }

    /* コードブロックのスタイル（編集時） */
    .code-block-editing {
      background-color: ${isDarkMode ? '#161b22' : '#f6f8fa'} !important;
      border: 2px solid ${isDarkMode ? '#30363d' : '#d0d7de'} !important;
      border-radius: 6px;
      padding: 12px;
      margin: 8px 0;
      font-family: "Courier New", monospace;
      position: relative;
    }

    .code-block-editing:before {
      content: '\\\`\\\`\\\`';
      position: absolute;
      top: 4px;
      left: 8px;
      font-size: 10px;
      color: ${isDarkMode ? '#8b949e' : '#656d76'} !important;
      font-weight: bold;
    }

    .code-block-editing:after {
      content: '\\\`\\\`\\\`';
      position: absolute;
      bottom: 4px;
      right: 8px;
      font-size: 10px;
      color: ${isDarkMode ? '#8b949e' : '#656d76'} !important;
      font-weight: bold;
    }
  `;

  // ダークモード対応のカスタムテーマ
  const customTheme = {
    toolbar: {
      toolbarBody: {
        backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
        borderTopColor: isDarkMode ? '#30363d' : '#d0d7de',
        borderBottomColor: isDarkMode ? '#30363d' : '#d0d7de',
      },
      toolbarButton: {
        backgroundColor: isDarkMode ? '#21262d' : '#f6f8fa',
        borderColor: isDarkMode ? '#30363d' : '#d0d7de',
        color: isDarkMode ? '#ffffff' : '#24292f',
      },
      toolbarButtonSelected: {
        backgroundColor: isDarkMode ? colors.primary : colors.primary,
        borderColor: isDarkMode ? colors.primary : colors.primary,
        color: '#ffffff',
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
    onUpdate: ({ editor }) => {
      // コンテンツ更新時にMathJax処理を実行
      if (typeof window !== 'undefined' && window.MathJax) {
        setTimeout(() => {
          window.MathJax.typesetPromise().catch((err: any) => {
            console.log('MathJax typeset error:', err);
          });
        }, 100);
      }
    },
    onChange: () => {
      // 外部からの更新中は onChange を無視
      if (isUpdatingFromExternal) {
        return;
      }
      
      // 新規ノートの初期選択処理中は onChange を無視
      if (isNewNote && !newNoteSelectionDone) {
        return;
      }
      
      editor.getHTML().then((html) => {
        if (html !== lastInternalContent.current) {
          lastInternalContent.current = html;
          onContentChange(html);
        }
      });
    },
    onKeyDown: (event) => {
      // Enterキーが押された時の処理
      if (event.key === 'Enter') {
        // 現在の選択範囲の情報を取得
        editor.getActiveNodeType().then((nodeType) => {
          // 見出し要素からの改行時は段落に変換
          if (nodeType && ['heading1', 'heading2', 'heading3', 'blockquote'].includes(nodeType)) {
            setTimeout(() => {
              editor.setParagraph();
            }, 50);
          }
        }).catch(() => {
          // エラーが発生した場合は何もしない
        });
      }
    },
  });

  // エディタの状態を取得
  const editorState = useBridgeState(editor);

  // Undo/RedoとHeading（Aa）ボタンを除外し、リスト系を最後に配置したカスタムツールバーアイテム
  const customToolbarItems: ToolbarItem[] = (() => {
    const filteredItems = DEFAULT_TOOLBAR_ITEMS.filter(
      (item, index) => {
        // 最後の2つ（Undo/Redo）と見出し選択（Heading）を除外
        return index < DEFAULT_TOOLBAR_ITEMS.length - 2 && index !== 4; // インデックス4が見出し選択
      }
    );
    
    // リスト系のボタンを識別して最後に移動
    const listItems: ToolbarItem[] = [];
    const nonListItems: ToolbarItem[] = [];
    
    filteredItems.forEach(item => {
      // リスト系アクションかどうかを判断
      if (item === 'orderedList' || item === 'bulletList' || item === 'taskList') {
        listItems.push(item);
      } else {
        nonListItems.push(item);
      }
    });
    
    // リスト系以外のアイテム + リスト系アイテムの順で結合
    return [...nonListItems, ...listItems];
  })();

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

  // インライン数式挿入ハンドラ
  const handleInlineMath = useCallback(() => {
    if (editor && editor.commands) {
      // TenTap Editorのcommands APIを使用してテキストを挿入
      editor.commands.insertContent('$a$');
    }
  }, [editor]);

  // インラインコード挿入ハンドラ
  const handleInlineCode = useCallback(() => {
    if (editor && editor.commands) {
      // TenTap Editorのcommands APIを使用してテキストを挿入
      editor.commands.insertContent('`code`');
    }
  }, [editor]);

  // インラインコメント挿入ハンドラ
  const handleInlineComment = useCallback(() => {
    if (editor && editor.commands) {
      // HTMLコメント形式を挿入
      editor.commands.insertContent('<!-- comment -->');
    }
  }, [editor]);

  // 水平線挿入ハンドラ
  const handleInsertDivider = useCallback(() => {
    if (editor && editor.commands) {
      // TenTap Editorの水平線挿入コマンドを使用
      editor.commands.setHorizontalRule();
    }
  }, [editor]);

  // コードブロック挿入ハンドラ
  const handleInsertCodeBlock = useCallback(() => {
    if (editor && editor.commands) {
      // TenTap Editorのコードブロック挿入コマンドを使用
      editor.commands.setCodeBlock();
    }
  }, [editor]);

  // 数学ブロック挿入ハンドラ
  const handleInsertMathBlock = useCallback(() => {
    if (editor && editor.commands) {
      // 数学ブロック用のテンプレートを挿入（段落として挿入してから数式記号を追加）
      editor.commands.insertContent('$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$');
    }
  }, [editor]);

  // 拡張ツールバーボタン
  const ExtendedToolbarButton = ({ 
    title, 
    icon, 
    onPress 
  }: { 
    title: string; 
    icon: React.ReactNode;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.extendedButton,
        { 
          backgroundColor: isDarkMode ? '#21262d' : '#f6f8fa',
          borderColor: isDarkMode ? '#30363d' : '#d0d7de'
        }
      ]}
      onPress={onPress}
    >
      {icon}
      <Text 
        style={[
          styles.extendedButtonText,
          { color: isDarkMode ? '#c9d1d9' : '#24292f' }
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // インライン機能ツールバー
  const InlineToolbar = () => (
    <View style={[styles.inlineToolbar, { 
      backgroundColor: isDarkMode ? '#161b22' : '#f8f9fa',
      borderTopColor: isDarkMode ? '#30363d' : '#d0d7de',
      borderBottomColor: isDarkMode ? '#30363d' : '#d0d7de'
    }]}>
      <View style={styles.inlineRow}>
        <ExtendedToolbarButton
          title="数式"
          icon={<Calculator size={16} color={isDarkMode ? '#c9d1d9' : '#24292f'} />}
          onPress={handleInlineMath}
        />
        <ExtendedToolbarButton
          title="コード"
          icon={<Hash size={16} color={isDarkMode ? '#c9d1d9' : '#24292f'} />}
          onPress={handleInlineCode}
        />
        <ExtendedToolbarButton
          title="コメント"
          icon={<MessageCircle size={16} color={isDarkMode ? '#c9d1d9' : '#24292f'} />}
          onPress={handleInlineComment}
        />
      </View>
    </View>
  );

  // 拡張ツールバー（水平線・コードブロック・数学ブロック）
  const ExtendedToolbar = () => (
    <View style={[styles.extendedToolbar, { 
      backgroundColor: isDarkMode ? '#161b22' : '#f8f9fa',
      borderTopColor: isDarkMode ? '#30363d' : '#d0d7de'
    }]}>
      <View style={styles.extendedRow}>
        <ExtendedToolbarButton
          title="水平線"
          icon={<Minus size={16} color={isDarkMode ? '#c9d1d9' : '#24292f'} />}
          onPress={handleInsertDivider}
        />
        <ExtendedToolbarButton
          title="コードブロック"
          icon={<Code size={16} color={isDarkMode ? '#c9d1d9' : '#24292f'} />}
          onPress={handleInsertCodeBlock}
        />
        <ExtendedToolbarButton
          title="数学ブロック"
          icon={<Calculator size={16} color={isDarkMode ? '#c9d1d9' : '#24292f'} />}
          onPress={handleInsertMathBlock}
        />
      </View>
    </View>
  );

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

  // 新規ノート選択処理完了フラグ
  const [newNoteSelectionDone, setNewNoteSelectionDone] = useState(false);

  // コンテンツが外部から変更された場合の同期
  useEffect(() => {
    if (editor && content !== lastInternalContent.current) {
      setIsUpdatingFromExternal(true);
      
      editor.getHTML().then((currentHTML) => {
        const contentToSet = content || '<p></p>';
        if (currentHTML !== contentToSet) {
          editor.setContent(contentToSet);
          lastInternalContent.current = contentToSet;
          
          // 新規ノートの場合はカーソルをH1テキストの末尾に配置（一度だけ実行）
          if (isNewNote && !newNoteSelectionDone && contentToSet.includes('<h1>無題のノート</h1>')) {
            setNewNoteSelectionDone(true);
            setTimeout(() => {
              try {
                // エディタにフォーカスしてH1要素の末尾にカーソルを配置
                editor.focus();
                
                // H1内の「無題のノート」テキストの末尾にカーソルを移動
                setTimeout(() => {
                  try {
                    // ProseMirrorのビューを直接操作してカーソル位置を設定
                    const editorView = (editor as any).view;
                    if (editorView && editorView.state) {
                      const { state } = editorView;
                      const { doc } = state;
                      
                      // H1要素の終端を検索
                      let targetPos = 7; // 「無題のノート」のテキスト長 + 1
                      doc.descendants((node, pos) => {
                        if (node.type.name === 'heading' && node.attrs.level === 1) {
                          // H1ノードの内容の終端を計算
                          targetPos = pos + node.nodeSize - 1;
                          return false;
                        }
                        return true;
                      });
                      
                      // カーソルを設定
                      const resolvedPos = doc.resolve(Math.max(1, Math.min(targetPos, doc.content.size - 1)));
                      const selection = state.selection.constructor.near(resolvedPos);
                      const tr = state.tr.setSelection(selection);
                      editorView.dispatch(tr);
                      console.log('新規ノート: H1テキスト末尾にカーソル配置完了');
                      
                      // lastInternalContent を現在のコンテンツで更新して同期を保つ
                      lastInternalContent.current = contentToSet;
                    } else {
                      console.log('エディタビューが利用できません');
                    }
                  } catch (positionError) {
                    console.log('カーソル位置設定エラー:', positionError);
                  }
                }, 200);
              } catch (focusError) {
                console.log('エディタフォーカスエラー:', focusError);
              }
            }, 400);
          }
        }
        // 短い遅延後に外部更新フラグをリセット
        setTimeout(() => {
          setIsUpdatingFromExternal(false);
        }, 150);
      }).catch(() => {
        // エラーが発生した場合は直接設定
        const contentToSet = content || '<p></p>';
        editor.setContent(contentToSet);
        lastInternalContent.current = contentToSet;
        setTimeout(() => {
          setIsUpdatingFromExternal(false);
        }, 150);
      });
    }
  }, [content, editor, isNewNote, newNoteSelectionDone]);

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
          
          {/* インライン機能ツールバー */}
          <InlineToolbar />
          
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

          {/* 拡張ツールバー（水平線・コードブロック・数学ブロック） */}
          <ExtendedToolbar />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const TenTapEditorWithRef = React.forwardRef(TenTapEditor);
TenTapEditorWithRef.displayName = 'TenTapEditor';

export default TenTapEditorWithRef; 