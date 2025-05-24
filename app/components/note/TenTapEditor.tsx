import React, { forwardRef, useImperativeHandle, useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Platform, SafeAreaView, KeyboardAvoidingView, TouchableOpacity, Text, useWindowDimensions, Alert } from 'react-native';
import { Table, Image, Highlighter, Minus } from 'lucide-react-native';
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
import useColors from '../../constants/colors';
import * as ImagePicker from 'expo-image-picker';

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
  insertTable: () => void;
  insertImage: () => void;
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
    extendedToolbar: {
      paddingVertical: isTablet ? 8 : 6,
      paddingHorizontal: isTablet ? 12 : 8,
      borderTopWidth: 1,
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
        backgroundColor: isDarkMode ? '#21262d' : '#f6f8fa',
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

  // コンテンツ更新の制御用 - 安定化改良版
  const [isUpdatingFromExternal, setIsUpdatingFromExternal] = useState(false);
  const lastInternalContent = useRef(content);
  const ignoreNextChange = useRef(false);
  
  // 新規ノート処理の簡素化
  const isInitialized = useRef(false);
  
  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      isInitialized.current = false;
    };
  }, []);
  
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
    initialContent: content || '<h1></h1>',
    autofocus: autoFocus,
    avoidIosKeyboard: true,
    editable: !readOnly,
    theme: customTheme,
    onChange: () => {
      // 更新制御フラグをチェック
      if (isUpdatingFromExternal || ignoreNextChange.current) {
        ignoreNextChange.current = false;
        return;
      }
      
      editor.getHTML().then((html) => {
        // 内容が実際に変更された場合のみ通知
        if (html !== lastInternalContent.current && html.trim() !== '') {
          lastInternalContent.current = html;
          onContentChange(html);
        }
      }).catch((error) => {
        console.log('エディタHTML取得エラー:', error);
      });
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
      // リスト系アクションかどうかを判断（文字列として比較）
      const itemStr = String(item);
      if (itemStr === 'orderedList' || itemStr === 'bulletList' || itemStr === 'taskList') {
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
          borderColor: isDarkMode ? '#30363d' : '#d0d7de'
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

  // 見出しボタンのハンドラ（トグル無効化 - 常に指定レベルの見出しに設定）
  const handleHeading = useCallback((level: number) => {
    if (editor) {
      try {
        // 現在の見出しレベルを取得
        const currentLevel = editorState?.headingLevel;
        
        if (currentLevel === level) {
          // 同じレベルが選択されている場合は何もしない（トグルを無効化）
          console.log('同じ見出しレベルが選択されているため、変更なし:', level);
          return;
        }
        
        console.log('見出しレベル変更:', currentLevel, '->', level);
        
        // 異なるレベルまたは段落から見出しに変更する場合
        let success = false;
        
        // 方法1: 標準のtoggleHeading
        try {
          editor.toggleHeading(level as 1 | 2 | 3 | 4 | 5 | 6);
          success = true;
          console.log('toggleHeadingによる見出し設定成功');
        } catch (e) {
          console.log('toggleHeading失敗:', e);
        }
        
        // 方法2: chainコマンド
        if (!success && (editor as any).chain) {
          try {
            (editor as any).chain().toggleHeading({ level }).run();
            success = true;
            console.log('chain().toggleHeadingによる見出し設定成功');
          } catch (e) {
            console.log('chain toggleHeading失敗:', e);
          }
        }
        
        // 方法3: setNodeで直接指定
        if (!success && (editor as any).chain) {
          try {
            (editor as any).chain().setNode('heading', { level }).run();
            success = true;
            console.log('setNodeによる見出し設定成功');
          } catch (e) {
            console.log('setNode失敗:', e);
          }
        }
        
        if (!success) {
          console.log('すべての見出し設定方法が失敗しました');
        } else {
          // 成功した場合は少し遅延してから状態を確認
          setTimeout(() => {
            try {
              (editor as any).updateState?.();
            } catch (e) {
              console.log('状態更新エラー:', e);
            }
          }, 50);
        }
      } catch (error) {
        console.log('見出し設定エラー:', error);
      }
    }
  }, [editor, editorState?.headingLevel]);

  // 段落（プレーンテキスト）ボタンのハンドラ（見出しからプレーンテキストに変換）
  const handleParagraph = useCallback(() => {
    if (editor) {
      try {
        const currentLevel = editorState?.headingLevel;
        
        if (currentLevel) {
          console.log('見出しから本文への変換開始, 現在のレベル:', currentLevel);
          
          // 複数の変換方法を順番に試行
          let success = false;
          
          // 方法1: TenTapエディタのsetParagraph
          if ('setParagraph' in editor && typeof editor.setParagraph === 'function') {
            try {
              editor.setParagraph();
              success = true;
              console.log('setParagraphによる変換成功');
            } catch (e) {
              console.log('setParagraph失敗:', e);
            }
          }
          
          // 方法2: chainを使ったclearNodes
          if (!success && (editor as any).chain) {
            try {
              (editor as any).chain().clearNodes().run();
              success = true;
              console.log('clearNodesによる変換成功');
            } catch (e) {
              console.log('clearNodes失敗:', e);
            }
          }
          
          // 方法3: toggleHeadingでfalseを設定
          if (!success && editor.toggleHeading) {
            try {
              // 現在の見出しレベルをfalseでトグル（段落に戻す）
              editor.toggleHeading(currentLevel as 1 | 2 | 3 | 4 | 5 | 6);
              success = true;
              console.log('toggleHeadingによる変換成功');
            } catch (e) {
              console.log('toggleHeading失敗:', e);
            }
          }
          
          // 方法4: 直接的なコマンド実行
          if (!success && (editor as any).commands) {
            try {
              (editor as any).commands.setParagraph();
              success = true;
              console.log('commands.setParagraphによる変換成功');
            } catch (e) {
              console.log('commands.setParagraph失敗:', e);
            }
          }
          
          // 方法5: setNodeを使用
          if (!success && (editor as any).chain) {
            try {
              (editor as any).chain().setNode('paragraph').run();
              success = true;
              console.log('setNodeによる変換成功');
            } catch (e) {
              console.log('setNode失敗:', e);
            }
          }
          
          // 方法6: liftを使用（最後の手段）
          if (!success && (editor as any).chain) {
            try {
              (editor as any).chain().lift('heading').run();
              success = true;
              console.log('liftによる変換成功');
            } catch (e) {
              console.log('lift失敗:', e);
            }
          }
          
          if (!success) {
            console.log('すべての変換方法が失敗しました');
          } else {
            // 成功した場合は少し遅延してから状態を確認
            setTimeout(() => {
              // 強制的にエディタの状態を更新
              try {
                (editor as any).updateState?.();
              } catch (e) {
                console.log('状態更新エラー:', e);
              }
            }, 50);
          }
        } else {
          console.log('既に本文（段落）形式です');
        }
      } catch (error) {
        console.log('段落設定エラー:', error);
      }
    }
  }, [editor, editorState?.headingLevel]);

  // 見出し選択ツールバーコンポーネント
  // 新しい仕様: 見出しボタンは二回押してもプレーンテキストにならない
  // プレーンテキストにするには「本文」ボタンを使用する
  const HeadingToolbar = () => {
    // 現在の見出しレベルを取得（より確実な方法）
    const currentHeadingLevel = editorState?.headingLevel;
    
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
            active={!currentHeadingLevel || currentHeadingLevel === 0}
            onPress={handleParagraph}
          />
          <HeadingToolbarButton
            title="大見出し"
            fontSize={18}
            fontWeight="600"
            active={currentHeadingLevel === 1}
            onPress={() => handleHeading(1)}
          />
          <HeadingToolbarButton
            title="中見出し"
            fontSize={16}
            fontWeight="600"
            active={currentHeadingLevel === 2}
            onPress={() => handleHeading(2)}
          />
          <HeadingToolbarButton
            title="小見出し"
            fontSize={14}
            fontWeight="600"
            active={currentHeadingLevel === 3}
            onPress={() => handleHeading(3)}
          />
        </View>
      </View>
    );
  };

  // refの実装
  useImperativeHandle(ref, () => ({
    editor,
    undo: () => {
      if (editor?.undo) {
        editor.undo();
      }
    },
    redo: () => {
      if (editor?.redo) {
        editor.redo();
      }
    },
    insertTable: () => {
      if (editor) {
        // TenTap Editorでサポートされている方法で表を挿入
        try {
          (editor as any).insertTable?.({ rows: 3, cols: 3, withHeaderRow: true }) ||
          (editor as any).insertContent?.('<table><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></table>');
        } catch (error) {
          console.log('表挿入エラー:', error);
        }
      }
    },
    insertImage: () => {
      if (editor) {
        // カメラロールから画像を選択
        ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        }).then((result) => {
          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            if (asset.base64) {
              const imageUrl = `data:image/jpeg;base64,${asset.base64}`;
              (editor as any).setImage?.(imageUrl) || 
              (editor as any).insertContent?.(`<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto;" />`);
            } else if (asset.uri) {
              (editor as any).setImage?.(asset.uri) || 
              (editor as any).insertContent?.(`<img src="${asset.uri}" alt="Image" style="max-width: 100%; height: auto;" />`);
            }
          }
        }).catch((error) => {
          console.error('画像選択エラー:', error);
          Alert.alert('エラー', '画像の選択に失敗しました');
        });
      }
    },
  }));

  // 新規ノートの初期化処理 - 根本的問題修正版
  useEffect(() => {
    if (isNewNote && editor && !isInitialized.current) {
      isInitialized.current = true;
      
      // 新規ノート用の安定初期化
      const initializeNewNote = async () => {
        try {
          // エディタの準備完了を待つ
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // 初期コンテンツを確実に設定
          if (content === '<h1></h1>') {
            try {
              await editor.setContent('<h1></h1>');
              lastInternalContent.current = '<h1></h1>';
            } catch (e) {
              console.log('初期コンテンツ設定エラー:', e);
            }
          }
          
          // フォーカス設定（少し遅延）
          if (autoFocus) {
            setTimeout(() => {
              try {
                editor.focus();
              } catch (e) {
                console.log('フォーカス設定エラー:', e);
              }
            }, 100);
          }
        } catch (error) {
          console.log('新規ノート初期化エラー:', error);
        }
      };
      
      initializeNewNote();
    }
  }, [isNewNote, editor, autoFocus, content]);

  // コンテンツが外部から変更された場合の同期 - 安定化版
  useEffect(() => {
    if (editor && content !== lastInternalContent.current) {
      // 新規ノートの初期化中はスキップ
      if (isNewNote && !isInitialized.current) {
        return;
      }
      
      setIsUpdatingFromExternal(true);
      ignoreNextChange.current = true;
      
      const updateContent = async () => {
        try {
          const contentToSet = content || '<h1></h1>';
          const currentHTML = await editor.getHTML();
          
          if (currentHTML !== contentToSet) {
            await editor.setContent(contentToSet);
            lastInternalContent.current = contentToSet;
          }
        } catch (error) {
          console.log('コンテンツ更新エラー:', error);
          // フォールバック処理
          try {
            const contentToSet = content || '<h1></h1>';
            await editor.setContent(contentToSet);
            lastInternalContent.current = contentToSet;
          } catch (fallbackError) {
            console.log('フォールバック更新エラー:', fallbackError);
          }
        } finally {
          // 確実にフラグをリセット
          setTimeout(() => {
            setIsUpdatingFromExternal(false);
            ignoreNextChange.current = false;
          }, 100);
        }
      };
      
      updateContent();
    }
  }, [content, editor, isNewNote]);

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
};

const TenTapEditorWithRef = React.forwardRef(TenTapEditor);
TenTapEditorWithRef.displayName = 'TenTapEditor';

export default TenTapEditorWithRef; 