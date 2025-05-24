import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView, useColorScheme } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useTheme } from '../../ui/ThemeProvider';
import useColors from '../../constants/colors';
import { useStore } from '../../store';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Quote, Link, Image, ListChecks, Highlighter, RotateCcw, RotateCw, Minus, Code, Calculator } from 'lucide-react-native';
      
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
  onHistoryStateChange?: (canUndo: boolean, canRedo: boolean) => void;
};

// refを使用するためにforwardRefを実装
const WebViewEditor = forwardRef<{ 
  editor: { richText: RichEditor }, 
  undo: () => void, 
  redo: () => void,
  canUndo: boolean,
  canRedo: boolean 
}, WebViewEditorProps>((
  {
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
    onHistoryStateChange,
  }, 
  ref
) => {
  const richText = useRef<RichEditor>(null);
  const { theme } = useTheme();
  const colors = useColors();
  const systemColorScheme = useColorScheme();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // グローバルなテーマ設定から正確なダークモード状態を取得
  const globalTheme = useStore(state => state.theme);
  
  // 正確なダークモード状態を計算
  const calculatedIsDarkMode = 
    propIsDarkMode !== undefined 
      ? propIsDarkMode 
      : globalTheme === 'dark' || (globalTheme === 'system' && systemColorScheme === 'dark');
  
  const [selectedText, setSelectedText] = useState('');
  
  // 親コンポーネントから参照できるようにする
  useImperativeHandle(ref, () => ({
    editor: {
      richText: richText.current as RichEditor,
    },
    undo: () => {
      if (richText.current) {
        richText.current.commandDOM('document.execCommand("undo", false, null)');
        // undo後に履歴状態を更新
        setTimeout(() => checkHistoryState(), 50);
      }
    },
    redo: () => {
      if (richText.current) {
        richText.current.commandDOM('document.execCommand("redo", false, null)');
        // redo後に履歴状態を更新
        setTimeout(() => checkHistoryState(), 50);
      }
    },
    canUndo,
    canRedo
  }));
  
  // 履歴状態（Undo/Redoの可否）を確認
  const checkHistoryState = useCallback(() => {
    if (richText.current) {
      richText.current.commandDOM(`
        (function() {
          try {
            // documentのcommandStateを使ってundo/redoの可否を確認
            const canUndo = document.queryCommandEnabled('undo');
            const canRedo = document.queryCommandEnabled('redo');
            
            // ネイティブ側に結果を返す
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'historyState',
              canUndo: canUndo,
              canRedo: canRedo
            }));
          } catch (e) {
            console.error('履歴状態確認エラー:', e);
          }
          return true;
        })()
      `);
    }
  }, [richText]);

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
    
    // 内容変更後に履歴状態を確認（少し遅延させて確実に状態を反映）
    setTimeout(() => checkHistoryState(), 50);
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

  // Undoアクションハンドラー
  const handleUndo = () => {
    if (richText.current && canUndo) {
      console.log('WebViewEditor: Undoアクション実行');
      richText.current.commandDOM('document.execCommand("undo", false, null)');
      // 操作後に履歴状態を更新
      setTimeout(() => checkHistoryState(), 50);
    } else {
      console.log('WebViewEditor: Undo不可または参照なし');
    }
  };

  // Redoアクションハンドラー
  const handleRedo = () => {
    if (richText.current && canRedo) {
      console.log('WebViewEditor: Redoアクション実行');
      richText.current.commandDOM('document.execCommand("redo", false, null)');
      // 操作後に履歴状態を更新
      setTimeout(() => checkHistoryState(), 50);
    } else {
      console.log('WebViewEditor: Redo不可または参照なし');
    }
  };
  
  // 現在の選択範囲のフォーマットをチェックするユーティリティ関数
  const checkFormatState = () => {
    if (richText.current) {
      const script = `
        (function() {
          try {
            // 現在のフォーマット状態を取得
            const formatBlock = document.queryCommandValue('formatBlock') || '';
            const isOrderedList = document.queryCommandState('insertOrderedList');
            const isUnorderedList = document.queryCommandState('insertUnorderedList');
            
            // カスタム検出: チェックボックスリスト (ul.checklist)
            const selection = window.getSelection();
            let isCheckboxList = false;
            if (selection && selection.rangeCount > 0) {
              let node = selection.anchorNode;
              // テキストノードの場合は親要素を取得
              if (node.nodeType === 3) node = node.parentNode;
              
              // 親要素をたどってulかつchecklistクラスを持つものを探す
              while (node && node !== document.body) {
                if (node.nodeName === 'UL' && node.classList.contains('checklist')) {
                  isCheckboxList = true;
                  break;
                }
                node = node.parentNode;
              }
            }
            
            // 結果を返す
          window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'formatState',
              formatBlock: formatBlock.toLowerCase(),
              isOrderedList: isOrderedList,
              isUnorderedList: isUnorderedList,
              isCheckboxList: isCheckboxList
            }));
          } catch (e) {
            console.error('フォーマット状態確認エラー:', e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(script);
    }
  };

  // フォーマット状態の管理
  const [formatState, setFormatState] = useState({
    formatBlock: '',
    isOrderedList: false,
    isUnorderedList: false,
    isCheckboxList: false
  });

  // WebViewからのメッセージハンドラを拡張して、フォーマット状態を受け取る
  const handleWebViewMessage = useCallback((message: any) => {
    try {
      const messageData = message.data;
      if (messageData && typeof messageData === 'string') {
        const parsedData = JSON.parse(messageData);
        
        if (parsedData.type === 'selection') {
          handleSelectionChange(parsedData);
          // 選択変更時にフォーマット状態もチェック
          checkFormatState();
        } else if (parsedData.type === 'contentChange') {
          console.log("WebViewEditor: onMessage contentChange from WebView:", parsedData.data?.substring(0,100));
          // コンテンツ変更時にフォーマット状態もチェック
          checkFormatState();
        } else if (parsedData.type === 'historyState') {
          // Undo/Redo状態の更新
          setCanUndo(parsedData.canUndo);
          setCanRedo(parsedData.canRedo);
        } else if (parsedData.type === 'formatState') {
          // フォーマット状態の更新
          setFormatState({
            formatBlock: parsedData.formatBlock || '',
            isOrderedList: parsedData.isOrderedList || false,
            isUnorderedList: parsedData.isUnorderedList || false,
            isCheckboxList: parsedData.isCheckboxList || false
          });
        }
      }
    } catch (e) {
      console.error('WebViewEditor: メッセージ解析エラー:', e, "受信データ:", message.data);
    }
  }, [handleSelectionChange]);

  // 選択範囲変更時やエディタ操作後にフォーマット状態を更新
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (richText.current) {
        checkFormatState();
      }
    }, 500); // 500ms毎に状態をチェック
    
    return () => clearInterval(intervalId);
  }, []);

  // カスタム見出し1ハンドラー
  const handleCustomHeadingOne = () => {
    if (richText.current) {
      richText.current.commandDOM(makeHeadingScript('h1'));
      setTimeout(() => checkFormatState(), 50);
    }
  };
  
  // カスタム見出し2ハンドラー
  const handleCustomHeadingTwo = () => {
    if (richText.current) {
      richText.current.commandDOM(makeHeadingScript('h2'));
      setTimeout(() => checkFormatState(), 50);
    }
  };
  
  // カスタム見出し3ハンドラー
  const handleCustomHeadingThree = () => {
    if (richText.current) {
      richText.current.commandDOM(makeHeadingScript('h3'));
      setTimeout(() => checkFormatState(), 50);
    }
  };
  
  // カスタム引用ハンドラー
  const handleCustomBlockquote = () => {
    if (richText.current) {
      console.log('WebViewEditor: 引用 カスタムアクション実行');
      const script = `
        (function() {
          try {
            // 現在のフォーマット状態を取得
            const formatBlock = document.queryCommandValue('formatBlock').toLowerCase();
            const isOrderedList = document.queryCommandState('insertOrderedList');
            const isUnorderedList = document.queryCommandState('insertUnorderedList');
            
            // チェックボックスリストの確認
          const selection = window.getSelection();
            let isCheckboxList = false;
            if (selection && selection.rangeCount > 0) {
              let node = selection.anchorNode;
              if (node.nodeType === 3) node = node.parentNode;
              while (node && node !== document.body) {
                if (node.nodeName === 'UL' && node.classList.contains('checklist')) {
                  isCheckboxList = true;
                  break;
                }
                node = node.parentNode;
              }
            }
            
            // 排他的処理
            if (formatBlock === 'blockquote') {
              // 同じフォーマットが適用されていれば解除する（トグル動作）
              document.execCommand('formatBlock', false, '<p>');
            } else {
              // リスト系が適用されていれば解除
              if (isOrderedList) document.execCommand('insertOrderedList', false, null);
              if (isUnorderedList) document.execCommand('insertUnorderedList', false, null);
              
              // チェックボックスリストの場合は選択範囲を包む親ULを特定して削除
              if (isCheckboxList && selection && selection.rangeCount > 0) {
                let node = selection.anchorNode;
                if (node.nodeType === 3) node = node.parentNode;
                while (node && node !== document.body) {
                  if (node.nodeName === 'UL' && node.classList.contains('checklist')) {
          const range = selection.getRangeAt(0);
                    const content = range.extractContents();
                    node.parentNode.replaceChild(content, node);
                    break;
                  }
                  node = node.parentNode;
                }
              }
              
              // 引用を適用
              document.execCommand('formatBlock', false, '<blockquote>');
            }
          } catch (e) {
            console.error('引用適用エラー:', e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(script);
      
      // 操作後にフォーマット状態を更新
      setTimeout(() => checkFormatState(), 50);
    }
  };
  
  // カスタム順序付きリストハンドラー
  const handleCustomOrderedList = () => {
    if (richText.current) {
      console.log('WebViewEditor: 順序付きリスト カスタムアクション実行');
      const script = `
        (function() {
          try {
            // 現在のフォーマット状態を取得
            const formatBlock = document.queryCommandValue('formatBlock').toLowerCase();
            const isOrderedList = document.queryCommandState('insertOrderedList');
            const isUnorderedList = document.queryCommandState('insertUnorderedList');
            
            // チェックボックスリストの確認
            const selection = window.getSelection();
            let isCheckboxList = false;
            let checklistNode = null;
            
            if (selection && selection.rangeCount > 0) {
              let node = selection.anchorNode;
              if (node.nodeType === 3) node = node.parentNode;
              while (node && node !== document.body) {
                if (node.nodeName === 'UL' && node.classList.contains('checklist')) {
                  isCheckboxList = true;
                  checklistNode = node;
                  break;
                }
                node = node.parentNode;
              }
            }
            
            // 排他的処理
            if (isOrderedList) {
              // 既に順序付きリストが適用されていれば解除（トグル動作）
              document.execCommand('insertOrderedList', false, null);
            } else {
              // 他のリスト系が適用されていれば解除
              if (isUnorderedList) document.execCommand('insertUnorderedList', false, null);
              
              // チェックボックスリストの場合は完全に解除
              if (isCheckboxList && checklistNode) {
                // リスト全体をフラグメントに変換
                try {
                  const fragment = document.createDocumentFragment();
                  const liItems = checklistNode.querySelectorAll('li');
                  
                  // 各リスト項目をP要素に変換
                  Array.from(liItems).forEach(item => {
                    const p = document.createElement('p');
                    // チェックボックスを削除
                    const checkbox = item.querySelector('.todo-checkbox');
                    if (checkbox) checkbox.remove();
                    
                    // 内容をコピー
                    while (item.firstChild) {
                      p.appendChild(item.firstChild);
                    }
                    fragment.appendChild(p);
                  });
                  
                  // リストノードを置き換え
                  checklistNode.parentNode.replaceChild(fragment, checklistNode);
                  
                  // 新しい選択範囲を設定
                  if (fragment.firstChild) {
                    const range = document.createRange();
                    range.selectNodeContents(fragment.firstChild);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                  
                  console.log('チェックリストから順序付きリストへの変換: チェックリスト解除完了');
                } catch (e) {
                  console.error('チェックリストから順序付きリストへの変換エラー:', e);
                  // フォールバック：選択範囲を使った変換
                  try {
                    const range = selection.getRangeAt(0);
                    const content = range.extractContents();
                    const paragraph = document.createElement('p');
                    paragraph.appendChild(content);
                    checklistNode.parentNode.replaceChild(paragraph, checklistNode);
                  } catch (e2) {
                    console.error('チェックリスト変換フォールバックエラー:', e2);
                    // 最終フォールバック - 元のコードに戻す
                    if (checklistNode && selection && selection.rangeCount > 0) {
                      let node = selection.anchorNode;
                      if (node.nodeType === 3) node = node.parentNode;
                      while (node && node !== document.body) {
                        if (node.nodeName === 'UL' && node.classList.contains('checklist')) {
                          const range = selection.getRangeAt(0);
                          const content = range.extractContents();
                          node.parentNode.replaceChild(content, node);
                          break;
                        }
                        node = node.parentNode;
                      }
                    }
                  }
                }
              }
              
              // 見出し系が適用されていれば段落に戻す
              if (['h1', 'h2', 'h3', 'blockquote'].includes(formatBlock)) {
                document.execCommand('formatBlock', false, '<p>');
              }
              
              // 順序付きリストを適用
              document.execCommand('insertOrderedList', false, null);
            }
          } catch (e) {
            console.error('順序付きリスト適用エラー:', e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(script);
      
      // 操作後にフォーマット状態を更新
      setTimeout(() => checkFormatState(), 50);
    }
  };
  
  // カスタム箇条書きリストハンドラー
  const handleCustomBulletsList = () => {
    if (richText.current) {
      console.log('WebViewEditor: 箇条書きリスト カスタムアクション実行');
      const script = `
        (function() {
          try {
            // 現在のフォーマット状態を取得
            const formatBlock = document.queryCommandValue('formatBlock').toLowerCase();
            const isOrderedList = document.queryCommandState('insertOrderedList');
            const isUnorderedList = document.queryCommandState('insertUnorderedList');
            
            // チェックボックスリストの確認
            const selection = window.getSelection();
            let isCheckboxList = false;
            let checklistNode = null;
            
            if (selection && selection.rangeCount > 0) {
              let node = selection.anchorNode;
              if (node.nodeType === 3) node = node.parentNode;
              while (node && node !== document.body) {
                if (node.nodeName === 'UL' && node.classList.contains('checklist')) {
                  isCheckboxList = true;
                  checklistNode = node;
                  break;
                }
                node = node.parentNode;
              }
            }
            
            // 排他的処理
            if (isUnorderedList) {
              // 既に箇条書きリストが適用されていれば解除（トグル動作）
              document.execCommand('insertUnorderedList', false, null);
            } else {
              // 他のリスト系が適用されていれば解除
              if (isOrderedList) document.execCommand('insertOrderedList', false, null);
              
              // チェックボックスリストの場合は完全に解除
              if (isCheckboxList && checklistNode) {
                // リスト全体をフラグメントに変換
                try {
                  const fragment = document.createDocumentFragment();
                  const liItems = checklistNode.querySelectorAll('li');
                  
                  // 各リスト項目をP要素に変換
                  Array.from(liItems).forEach(item => {
                    const p = document.createElement('p');
                    // チェックボックスを削除
                    const checkbox = item.querySelector('.todo-checkbox');
                    if (checkbox) checkbox.remove();
                    
                    // 内容をコピー
                    while (item.firstChild) {
                      p.appendChild(item.firstChild);
                    }
                    fragment.appendChild(p);
                  });
                  
                  // リストノードを置き換え
                  checklistNode.parentNode.replaceChild(fragment, checklistNode);
                  
                  // 新しい選択範囲を設定
                  if (fragment.firstChild) {
                    const range = document.createRange();
                    range.selectNodeContents(fragment.firstChild);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                  
                  console.log('チェックリストから箇条書きリストへの変換: チェックリスト解除完了');
                } catch (e) {
                  console.error('チェックリストから箇条書きリストへの変換エラー:', e);
                  // フォールバック：選択範囲を使った変換
                  try {
                    const range = selection.getRangeAt(0);
                    const content = range.extractContents();
                    const paragraph = document.createElement('p');
                    paragraph.appendChild(content);
                    checklistNode.parentNode.replaceChild(paragraph, checklistNode);
                  } catch (e2) {
                    console.error('チェックリスト変換フォールバックエラー:', e2);
                    // 最終フォールバック - 元のコードに戻す
                    if (checklistNode && selection && selection.rangeCount > 0) {
                      let node = selection.anchorNode;
                      if (node.nodeType === 3) node = node.parentNode;
                      while (node && node !== document.body) {
                        if (node.nodeName === 'UL' && node.classList.contains('checklist')) {
                          const range = selection.getRangeAt(0);
                          const content = range.extractContents();
                          node.parentNode.replaceChild(content, node);
                          break;
                        }
                        node = node.parentNode;
                      }
                    }
                  }
                }
              }
              
              // 見出し系が適用されていれば段落に戻す
              if (['h1', 'h2', 'h3', 'blockquote'].includes(formatBlock)) {
                document.execCommand('formatBlock', false, '<p>');
              }
              
              // 箇条書きリストを適用
              document.execCommand('insertUnorderedList', false, null);
            }
          } catch (e) {
            console.error('箇条書きリスト適用エラー:', e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(script);
      
      // 操作後にフォーマット状態を更新
      setTimeout(() => checkFormatState(), 50);
    }
  };
  
  // カスタムチェックリストハンドラー
  const handleCustomCheckboxList = () => {
    if (richText.current) {
      const script = `
        (function() {
          try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return true;
            let node = selection.anchorNode;
            if (node.nodeType === 3) node = node.parentNode;

            // 1. 選択範囲内のh1/h2/h3/blockquoteをpに変換
            let range = selection.getRangeAt(0);
            let commonAncestor = range.commonAncestorContainer;
            if (commonAncestor.nodeType === 3) commonAncestor = commonAncestor.parentNode;
            const headings = commonAncestor.querySelectorAll ? commonAncestor.querySelectorAll('h1, h2, h3, blockquote') : [];
            headings.forEach(h => {
              const p = document.createElement('p');
              while (h.firstChild) p.appendChild(h.firstChild);
              h.parentNode.replaceChild(p, h);
            });

            // 2. 既存のチェックリストなら解除
            let checklistNode = null;
            let temp = node;
            while (temp && temp !== document.body) {
              if (temp.nodeName === 'UL' && temp.classList.contains('checklist')) {
                checklistNode = temp;
                break;
              }
              temp = temp.parentNode;
            }
            if (checklistNode) {
              // チェックリスト解除
              const fragment = document.createDocumentFragment();
              const liItems = checklistNode.querySelectorAll('li');
              liItems.forEach(item => {
                // チェックボックス除去
                const cb = item.querySelector('.todo-checkbox');
                if (cb) cb.remove();
                const p = document.createElement('p');
                while (item.firstChild) p.appendChild(item.firstChild);
                fragment.appendChild(p);
              });
              checklistNode.parentNode.replaceChild(fragment, checklistNode);
              return true;
            }

            // 3. 他のリスト系が適用されていれば解除
            if (document.queryCommandState('insertOrderedList')) document.execCommand('insertOrderedList', false, null);
            if (document.queryCommandState('insertUnorderedList')) document.execCommand('insertUnorderedList', false, null);

            // 4. チェックリストを適用
            document.execCommand('insertUnorderedList', false, null);
            setTimeout(function() {
              let node = selection.anchorNode;
              if (node.nodeType === 3) node = node.parentNode;
              while (node && node !== document.body) {
                if (node.nodeName === 'UL') {
                  node.classList.add('checklist');
                  const items = node.querySelectorAll('li');
                  items.forEach(item => {
                    // 既存のチェックボックスを除去
                    const old = item.querySelector('.todo-checkbox');
                    if (old) old.remove();
                    // チェックボックス追加
                    const checkbox = document.createElement('span');
                    checkbox.className = 'todo-checkbox';
                    checkbox.contentEditable = 'false';
                    checkbox.innerHTML = '☐ ';
                    checkbox.addEventListener('click', function() {
                      this.innerHTML = (this.innerHTML === '☐ ') ? '☑ ' : '☐ ';
                    });
                    if (item.firstChild) {
                      item.insertBefore(checkbox, item.firstChild);
                    } else {
                      item.appendChild(checkbox);
                    }
                  });
                  break;
                }
                node = node.parentNode;
              }
            }, 10);
          } catch (e) {
            console.error('チェックリスト適用エラー:', e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(script);
      setTimeout(() => checkFormatState(), 100);
    }
  };

  // 見出し系ハンドラー共通ロジック
  function makeHeadingScript(tag: string) {
    return `
      (function() {
        try {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return true;
          let node = selection.anchorNode;
          if (node.nodeType === 3) node = node.parentNode;

          // 1. チェックリスト内ならli > .todo-checkboxを除去しliの中身をpに変換
          let checklistNode = null;
          let temp = node;
          while (temp && temp !== document.body) {
            if (temp.nodeName === 'UL' && temp.classList.contains('checklist')) {
              checklistNode = temp;
              break;
            }
            temp = temp.parentNode;
          }
          if (checklistNode) {
            const liItems = checklistNode.querySelectorAll('li');
            liItems.forEach(item => {
              const cb = item.querySelector('.todo-checkbox');
              if (cb) cb.remove();
              const p = document.createElement('p');
              while (item.firstChild) p.appendChild(item.firstChild);
              item.parentNode.replaceChild(p, item);
            });
            // チェックリストUL自体もpに変換
            const fragment = document.createDocumentFragment();
            while (checklistNode.firstChild) fragment.appendChild(checklistNode.firstChild);
            const p = document.createElement('p');
            while (fragment.firstChild) p.appendChild(fragment.firstChild);
            checklistNode.parentNode.replaceChild(p, checklistNode);
            node = p;
          }

          // 2. 他のリスト系が適用されていれば解除
          if (document.queryCommandState('insertOrderedList')) document.execCommand('insertOrderedList', false, null);
          if (document.queryCommandState('insertUnorderedList')) document.execCommand('insertUnorderedList', false, null);

          // 3. トグル動作
          const formatBlock = document.queryCommandValue('formatBlock').toLowerCase();
          if (formatBlock === '${tag}') {
            document.execCommand('formatBlock', false, '<p>');
          } else {
            document.execCommand('formatBlock', false, '<${tag}>');
          }
        } catch (e) {
          console.error('${tag}適用エラー:', e);
        }
        return true;
      })();
    `;
  }

  const editorActions = [
    actions.heading1, actions.heading2, actions.heading3, actions.blockquote,
    actions.setBold, actions.setItalic, actions.setUnderline, actions.setStrikethrough,
    'highlight', 
    actions.insertOrderedList, actions.insertBulletsList,
    actions.insertLink,
    'divider', 'codeBlock', 'mathBlock',
    actions.checkboxList,
  ];

  const customIconMap = {
    [actions.setBold]: ({ tintColor }: { tintColor?: string }) => <Bold size={20} color={tintColor || colors.text} />,
    [actions.setItalic]: ({ tintColor }: { tintColor?: string }) => <Italic size={20} color={tintColor || colors.text} />,
    [actions.setUnderline]: ({ tintColor }: { tintColor?: string }) => <Underline size={20} color={tintColor || colors.text} />,
    [actions.setStrikethrough]: ({ tintColor }: { tintColor?: string }) => <Strikethrough size={20} color={tintColor || colors.text} />,
    [actions.heading1]: ({ tintColor }: { tintColor?: string }) => <Heading1 size={20} color={tintColor || colors.text} />,
    [actions.heading2]: ({ tintColor }: { tintColor?: string }) => <Heading2 size={20} color={tintColor || colors.text} />,
    [actions.heading3]: ({ tintColor }: { tintColor?: string }) => <Heading3 size={20} color={tintColor || colors.text} />,
    [actions.blockquote]: ({ tintColor }: { tintColor?: string }) => <Quote size={20} color={tintColor || colors.text} />,
    [actions.insertOrderedList]: ({ tintColor }: { tintColor?: string }) => <ListOrdered size={20} color={tintColor || colors.text} />,
    [actions.insertBulletsList]: ({ tintColor }: { tintColor?: string }) => <List size={20} color={tintColor || colors.text} />,
    [actions.checkboxList]: ({ tintColor }: { tintColor?: string }) => <ListChecks size={20} color={tintColor || colors.text} />,
    [actions.insertLink]: ({ tintColor }: { tintColor?: string }) => <Link size={20} color={tintColor || colors.text} />,
    [actions.insertImage]: ({ tintColor }: { tintColor?: string }) => <Image size={20} color={tintColor || colors.text} />,
    ['highlight']: ({ tintColor }: { tintColor?: string }) => <Highlighter size={20} color={tintColor || colors.text} />,
    ['undo']: ({ tintColor }: { tintColor?: string }) => (
      <RotateCcw size={20} color={canUndo ? (tintColor || colors.text) : colors.gray} opacity={canUndo ? 1 : 0.5} />
    ),
    ['redo']: ({ tintColor }: { tintColor?: string }) => (
      <RotateCw size={20} color={canRedo ? (tintColor || colors.text) : colors.gray} opacity={canRedo ? 1 : 0.5} />
    ),
    ['divider']: ({ tintColor }: { tintColor?: string }) => <Minus size={20} color={tintColor || colors.text} />,
    ['codeBlock']: ({ tintColor }: { tintColor?: string }) => <Code size={20} color={tintColor || colors.text} />,
    ['mathBlock']: ({ tintColor }: { tintColor?: string }) => <Calculator size={20} color={tintColor || colors.text} />,
  };

  // 水平線挿入ハンドラー
  const handleInsertDivider = () => {
    if (richText.current) {
      const script = `
        (function() {
          try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return false;
            
            // 現在の位置に水平線を挿入
            const hr = document.createElement('hr');
            hr.style.border = 'none';
            hr.style.borderTop = '2px solid ${calculatedIsDarkMode ? '#30363d' : '#d0d7de'}';
            hr.style.margin = '16px 0';
            hr.style.width = '100%';
            
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(hr);
            
            // カーソルを水平線の後に移動
            const newParagraph = document.createElement('p');
            newParagraph.innerHTML = '<br>';
            hr.parentNode.insertBefore(newParagraph, hr.nextSibling);
            
            range.setStart(newParagraph, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            console.log('水平線挿入完了');
          } catch (e) {
            console.error('水平線挿入エラー:', e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(script);
    }
  };

  // コードブロック挿入ハンドラー
  const handleInsertCodeBlock = () => {
    if (richText.current) {
      const script = `
        (function() {
          try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return false;
            
            // コードブロック用のpre要素を作成
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = 'コードをここに入力';
            code.style.fontFamily = 'Courier New, monospace';
            code.style.fontSize = '14px';
            code.style.lineHeight = '1.5';
            
            pre.appendChild(code);
            pre.style.backgroundColor = '${calculatedIsDarkMode ? '#161b22' : '#f6f8fa'}';
            pre.style.border = '1px solid ${calculatedIsDarkMode ? '#30363d' : '#d0d7de'}';
            pre.style.borderRadius = '6px';
            pre.style.padding = '12px';
            pre.style.margin = '8px 0';
            pre.style.overflow = 'auto';
            pre.style.color = '${calculatedIsDarkMode ? '#e6edf3' : '#24292f'}';
            
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(pre);
            
            // カーソルをコードブロック内に移動
            range.setStart(code, 0);
            range.setEnd(code, code.childNodes.length);
            selection.removeAllRanges();
            selection.addRange(range);
            
            console.log('コードブロック挿入完了');
          } catch (e) {
            console.error('コードブロック挿入エラー:', e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(script);
    }
  };

  // 数学ブロック挿入ハンドラー
  const handleInsertMathBlock = () => {
    if (richText.current) {
      const script = `
        (function() {
          try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return false;
            
            // 数学ブロック用のdiv要素を作成
            const mathDiv = document.createElement('div');
            mathDiv.className = 'math-block';
            mathDiv.contentEditable = 'true';
            mathDiv.textContent = 'x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}';
            
            mathDiv.style.backgroundColor = '${calculatedIsDarkMode ? '#0d1117' : '#ffffff'}';
            mathDiv.style.border = '2px solid ${calculatedIsDarkMode ? '#30363d' : '#d0d7de'}';
            mathDiv.style.borderRadius = '6px';
            mathDiv.style.padding = '12px';
            mathDiv.style.margin = '8px 0';
            mathDiv.style.fontFamily = 'Courier New, monospace';
            mathDiv.style.fontSize = '16px';
            mathDiv.style.color = '${calculatedIsDarkMode ? '#c9d1d9' : '#24292f'}';
            mathDiv.style.textAlign = 'center';
            mathDiv.style.position = 'relative';
            
            // ラベルを追加
            const label = document.createElement('div');
            label.textContent = 'LaTeX';
            label.style.position = 'absolute';
            label.style.top = '4px';
            label.style.right = '8px';
            label.style.fontSize = '10px';
            label.style.color = '${calculatedIsDarkMode ? '#8b949e' : '#656d76'}';
            label.style.fontWeight = 'bold';
            label.style.textTransform = 'uppercase';
            mathDiv.appendChild(label);
            
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(mathDiv);
            
            // カーソルを数学ブロック内に移動
            range.setStart(mathDiv, 0);
            range.setEnd(mathDiv, 1);
            selection.removeAllRanges();
            selection.addRange(range);
            
            console.log('数学ブロック挿入完了');
          } catch (e) {
            console.error('数学ブロック挿入エラー:', e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(script);
    }
  };

  const customActions = {
    highlight: handleHighlight,
    undo: handleUndo,
    redo: handleRedo,
    divider: handleInsertDivider,
    codeBlock: handleInsertCodeBlock,
    mathBlock: handleInsertMathBlock,
    [actions.checkboxList]: handleCustomCheckboxList
  };
  
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
      
      // カスタムスタイルを追加（チェックボックスリスト用）
      const initializeCustomStyles = `
        (function() {
          try {
            // チェックボックスリスト用のスタイルを追加
            if (!document.getElementById('custom-editor-styles')) {
              const style = document.createElement('style');
              style.id = 'custom-editor-styles';
              style.textContent = \`
                ul.checklist {
                  list-style-type: none;
                  padding-left: 0.5em;
                }
                ul.checklist li {
                  position: relative;
                  padding-left: 1.5em;
                  margin-bottom: 0.5em;
                }
                .todo-checkbox {
                  cursor: pointer;
                  user-select: none;
                  margin-right: 0.5em;
                  font-size: 1.2em;
                }
                .math-block {
                  background-color: ${calculatedIsDarkMode ? '#0d1117' : '#ffffff'};
                  border: 2px solid ${calculatedIsDarkMode ? '#30363d' : '#d0d7de'};
                  border-radius: 6px;
                  padding: 12px;
                  margin: 8px 0;
                  font-family: 'Courier New', monospace;
                  font-size: 16px;
                  color: ${calculatedIsDarkMode ? '#c9d1d9' : '#24292f'};
                  text-align: center;
                  position: relative;
                }
                .math-block:before {
                  content: 'LaTeX';
                  position: absolute;
                  top: 4px;
                  right: 8px;
                  font-size: 10px;
                  color: ${calculatedIsDarkMode ? '#8b949e' : '#656d76'};
                  font-weight: bold;
                  text-transform: uppercase;
                }
              \`;
              document.head.appendChild(style);
              console.log("WebViewEditor: カスタムスタイルを初期化しました");
            }
          } catch (e) {
            console.error("WebViewEditor: カスタムスタイル初期化エラー:", e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(initializeCustomStyles);
      
      // デフォルトのフォーマット動作をオーバーライドするための初期化スクリプト
      const overrideDefaultFormattingScript = `
        (function() {
          try {
            // オリジナルのexecCommandをバックアップ
            if (!document.originalExecCommand) {
              document.originalExecCommand = document.execCommand;
              
              // チェックボックスリスト操作のユーティリティ関数を定義
              window.editorFunctions = {
                // チェックボックスリストを作成する
                createCheckboxList: function() {
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0) return;
                  
                  // いったん段落に戻してから処理を始める
                  document.originalExecCommand('formatBlock', false, '<p>');
                  
                  // まず通常のリストを作成
                  document.originalExecCommand('insertUnorderedList', false, null);
                  
                  // 次にチェックボックス用のクラスを追加
                  let node = selection.anchorNode;
                  if (node && node.nodeType === 3) node = node.parentNode;
                  
                  while (node && node !== document.body) {
                    if (node.nodeName === 'UL') {
                      node.classList.add('checklist');
                      
                      // リスト内の各項目にチェックボックスを追加
                      const items = node.querySelectorAll('li');
                      for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        // 既にチェックボックスが含まれていなければ追加
                        if (!item.querySelector('.todo-checkbox')) {
                          const checkbox = document.createElement('span');
                          checkbox.className = 'todo-checkbox';
                          checkbox.contentEditable = 'false';
                          checkbox.innerHTML = '☐ ';
                          checkbox.addEventListener('click', function() {
                            if (this.innerHTML === '☐ ') {
                              this.innerHTML = '☑ ';
                            } else {
                              this.innerHTML = '☐ ';
                            }
                          });
                          
                          // 既存のテキストの前にチェックボックスを挿入
                          if (item.firstChild) {
                            item.insertBefore(checkbox, item.firstChild);
                          } else {
                            item.appendChild(checkbox);
                          }
                        }
                      }
                      console.log('createCheckboxList: チェックボックスリスト作成完了');
                      break;
                    }
                    node = node.parentNode;
                  }
                },
                
                // チェックボックスリストを検出する
                isCheckboxListApplied: function() {
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0) return null;
                  
                  let node = selection.anchorNode;
                  if (node && node.nodeType === 3) node = node.parentNode;
                  
                  while (node && node !== document.body) {
                    if (node.nodeName === 'UL' && node.classList.contains('checklist')) {
                      return node; // チェックボックスリストのノードを返す
                    }
                    node = node.parentNode;
                  }
                  
                  return null; // 適用されていない
                },
                
                // リスト項目が空かチェック
                isListItemEmpty: function(item) {
                  // チェックボックスを除外して内容をチェック
                  const checkbox = item.querySelector('.todo-checkbox');
                  if (checkbox) checkbox.remove();
                  
                  // テキスト内容をトリミング
                  const textContent = item.textContent.trim();
                  
                  // チェックボックスを再度追加
                  if (checkbox && item.firstChild) {
                    item.insertBefore(checkbox, item.firstChild);
                  } else if (checkbox) {
                    item.appendChild(checkbox);
                  }
                  
                  return textContent === '';
                },
                
                // 改行後の処理 - 空の項目をチェックして適切に処理
                handleEmptyListItem: function(event) {
                  if (event.key === 'Enter') {
                    const selection = window.getSelection();
                    if (!selection || selection.rangeCount === 0) return;
                    
                    let node = selection.anchorNode;
                    if (node.nodeType === 3) node = node.parentNode;
                    
                    // リスト項目内にいるか確認
                    let listItem = null;
                    while (node && node !== document.body) {
                      if (node.nodeName === 'LI') {
                        listItem = node;
                        break;
                      }
                      node = node.parentNode;
                    }
                    
                    if (listItem) {
                      // リスト項目が空かチェック
                      if (this.isListItemEmpty(listItem)) {
                        // 親のULを取得
                        const ul = listItem.parentNode;
                        if (ul && ul.classList.contains('checklist')) {
                          // 1つ前の項目がチェックボックスリストの最後の項目なら
                          if (listItem === ul.lastElementChild) {
                            // デフォルトのEnterキー処理をキャンセル
                            event.preventDefault();
                            
                            // 空の項目を削除
                            listItem.remove();
                            
                            // チェックリストを抜けるために段落を挿入
                            const p = document.createElement('p');
                            p.innerHTML = '<br>';
                            
                            // 現在のリストの後に段落を挿入
                            if (ul.nextSibling) {
                              ul.parentNode.insertBefore(p, ul.nextSibling);
                            } else {
                              ul.parentNode.appendChild(p);
                            }
                            
                            // 選択範囲を新しい段落に移動
                            const range = document.createRange();
                            range.setStart(p, 0);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                            
                            return true;
                          }
                        }
                      }
                    }
                  }
                  return false;
                },
                
                // チェックボックスリストを解除する
                removeCheckboxList: function() {
                  const checkboxListNode = this.isCheckboxListApplied();
                  if (!checkboxListNode) return false;
                  
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0) return false;
                  
                  try {
                    // リスト全体をフラグメントに変換
                    const fragment = document.createDocumentFragment();
                    const liItems = checkboxListNode.querySelectorAll('li');
                    
                    // 各リスト項目をP要素に変換
                    liItems.forEach(item => {
                      const p = document.createElement('p');
                      // チェックボックスを削除
                      const checkbox = item.querySelector('.todo-checkbox');
                      if (checkbox) checkbox.remove();
                      
                      // 内容をコピー
                      while (item.firstChild) {
                        p.appendChild(item.firstChild);
                      }
                      fragment.appendChild(p);
                    });
                    
                    // リストノードを置き換え
                    checkboxListNode.parentNode.replaceChild(fragment, checkboxListNode);
                    console.log('removeCheckboxList: チェックボックスリスト全体解除完了');
                    return true;
                  } catch (e) {
                    console.error('removeCheckboxList全体変換エラー:', e);
                    
                    // フォールバック：選択範囲のみを変換
                    try {
                      const range = selection.getRangeAt(0);
                      const content = range.extractContents();
                      const paragraph = document.createElement('p');
                      paragraph.appendChild(content);
                      checkboxListNode.parentNode.replaceChild(paragraph, checkboxListNode);
                      console.log('removeCheckboxList: チェックボックスリスト解除完了');
                      return true;
                    } catch (e) {
                      console.error('removeCheckboxList エラー:', e);
                      return false;
                    }
                  }
                }
              };
              
              // Enterキーのイベントリスナーを追加（チェックリスト用と見出し処理）
              document.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                  // チェックボックスリスト内の空の項目に対する特別処理
                  if (window.editorFunctions.handleEmptyListItem(event)) {
                    console.log('空のチェックボックスリスト項目で改行: 特別処理実行');
                    return;
                  }
                  
                  // 見出し要素からの改行処理
                  const selection = window.getSelection();
                  if (selection && selection.rangeCount > 0) {
                    let node = selection.anchorNode;
                    if (node.nodeType === 3) node = node.parentNode;
                    
                    // 見出し要素の中にいるかチェック
                    while (node && node !== document.body) {
                      const nodeName = node.nodeName.toLowerCase();
                      if (['h1', 'h2', 'h3', 'blockquote'].includes(nodeName)) {
                        // 改行後に段落要素を挿入するよう調整
                        setTimeout(function() {
                          const newSelection = window.getSelection();
                          if (newSelection && newSelection.rangeCount > 0) {
                            let currentNode = newSelection.anchorNode;
                            if (currentNode.nodeType === 3) currentNode = currentNode.parentNode;
                            
                            // 新しく作成された要素が見出しの場合は段落に変換
                            const currentNodeName = currentNode.nodeName.toLowerCase();
                            if (['h1', 'h2', 'h3', 'blockquote'].includes(currentNodeName)) {
                              document.execCommand('formatBlock', false, '<p>');
                              console.log('見出しから改行: 段落に変換完了');
                            }
                          }
                        }, 10);
                        break;
                      }
                      node = node.parentNode;
                    }
                  }
                }
              });
              
              // execCommandをオーバーライドして排他ロジックを組み込む
              document.execCommand = function(command, showUI, value) {
                console.log('execCommand intercepted:', command, value);
                
                // カスタムチェックボックスリストコマンドの処理
                if (command === 'checkboxList') {
                  // 現在の状態チェック
                  const checkboxListNode = window.editorFunctions.isCheckboxListApplied();
                  const isCheckboxList = Boolean(checkboxListNode);
                  const currentFormat = document.queryCommandValue('formatBlock').toLowerCase();
                  const isOrderedList = document.queryCommandState('insertOrderedList');
                  const isUnorderedList = document.queryCommandState('insertUnorderedList');
                  
                  console.log('checkboxList command:', {
                    isCheckboxList,
                    currentFormat,
                    isOrderedList,
                    isUnorderedList
                  });
                  
                  // トグル動作
                  if (isCheckboxList) {
                    return window.editorFunctions.removeCheckboxList();
                  }
                  
                  // 他のフォーマットを解除
                  if (isOrderedList) document.originalExecCommand('insertOrderedList', false, null);
                  if (isUnorderedList) document.originalExecCommand('insertUnorderedList', false, null);
                  
                  // 見出し・引用の場合、適切に段落に戻す
                  if (['h1', 'h2', 'h3', 'blockquote'].includes(currentFormat)) {
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      // 現在の選択範囲を含む見出し要素を見つける
                      let headingNode = selection.anchorNode;
                      if (headingNode.nodeType === 3) headingNode = headingNode.parentNode;
                      
                      // 見出し要素に到達するまで親をたどる
                      let foundHeading = false;
                      while (headingNode && headingNode !== document.body) {
                        const nodeName = headingNode.nodeName.toLowerCase();
                        if (['h1', 'h2', 'h3', 'blockquote'].includes(nodeName)) {
                          // 見出し要素を段落に置き換え
                          const newParagraph = document.createElement('p');
                          
                          // 内容をコピー
                          while (headingNode.firstChild) {
                            newParagraph.appendChild(headingNode.firstChild);
                          }
                          
                          headingNode.parentNode.replaceChild(newParagraph, headingNode);
                          console.log('見出しから段落への変換完了 (execCommand)');
                          foundHeading = true;
                          break;
                        }
                        headingNode = headingNode.parentNode;
                      }
                      
                      // 見出し要素が見つからなかった場合、通常の方法で変換
                      if (!foundHeading) {
                        document.originalExecCommand('formatBlock', false, '<p>');
                      }
                    } else {
                      document.originalExecCommand('formatBlock', false, '<p>');
                    }
                  }
                  
                  // チェックボックスリストを作成
                  window.editorFunctions.createCheckboxList();
                  return true;
                }
                
                // フォーマット関連のコマンドの場合、特別な処理を行う
                if (command === 'formatBlock') {
                  const formatValue = value.replace(/[<>]/g, '').toLowerCase();
                  
                  // 現在の状態を取得
                  const currentFormat = document.queryCommandValue('formatBlock').toLowerCase();
                  const isOrderedList = document.queryCommandState('insertOrderedList');
                  const isUnorderedList = document.queryCommandState('insertUnorderedList');
                  const checkboxListNode = window.editorFunctions.isCheckboxListApplied();
                  const isCheckboxList = Boolean(checkboxListNode);
                  
                  // 見出し系を適用する場合は既存のリスト系を解除
                  if (['h1', 'h2', 'h3', 'blockquote'].includes(formatValue)) {
                    // リストが適用されていれば解除
                    if (isOrderedList) document.originalExecCommand('insertOrderedList', false, null);
                    if (isUnorderedList) document.originalExecCommand('insertUnorderedList', false, null);
                    if (isCheckboxList) window.editorFunctions.removeCheckboxList();
                    
                    // トグル動作（同じフォーマットが適用されていれば解除）
                    if (currentFormat === formatValue) {
                      return document.originalExecCommand('formatBlock', false, '<p>');
                    }
                  }
                }
                
                // リスト系のコマンドの場合
                if (['insertOrderedList', 'insertUnorderedList'].includes(command)) {
                  // 現在の状態チェック
                  const currentFormat = document.queryCommandValue('formatBlock').toLowerCase();
                  const isOrderedList = document.queryCommandState('insertOrderedList');
                  const isUnorderedList = document.queryCommandState('insertUnorderedList');
                  const checkboxListNode = window.editorFunctions.isCheckboxListApplied();
                  const isCheckboxList = Boolean(checkboxListNode);
                  const isTargetOrderedList = command === 'insertOrderedList';
                  const isCurrentOrderedList = isOrderedList && isTargetOrderedList;
                  const isCurrentUnorderedList = isUnorderedList && !isTargetOrderedList;
                  
                  // トグル動作（同じリストが適用されていれば解除）
                  if ((isCurrentOrderedList) || (isCurrentUnorderedList)) {
                    return document.originalExecCommand(command, showUI, value);
                  }
                  
                  // 他のリスト系を解除
                  if (isOrderedList && !isTargetOrderedList) {
                    document.originalExecCommand('insertOrderedList', false, null);
                  } else if (isUnorderedList && isTargetOrderedList) {
                    document.originalExecCommand('insertUnorderedList', false, null);
                  }
                  
                  // チェックボックスリストの解除
                  if (isCheckboxList) {
                    window.editorFunctions.removeCheckboxList();
                  }
                  
                  // 見出し系が適用されていれば段落に戻す
                  if (['h1', 'h2', 'h3', 'blockquote'].includes(currentFormat)) {
                    document.originalExecCommand('formatBlock', false, '<p>');
                  }
                }
                
                // オリジナルのexecCommandを実行
                return document.originalExecCommand(command, showUI, value);
              };
              
              console.log('WebViewEditor: execCommandをオーバーライドしました');
            }
          } catch (e) {
            console.error('WebViewEditor: execCommandオーバーライドエラー:', e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(overrideDefaultFormattingScript);
      
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
        
        // 履歴状態を定期的に確認
        setTimeout(function checkUndoRedoState() {
          try {
            const canUndo = document.queryCommandEnabled('undo');
            const canRedo = document.queryCommandEnabled('redo');
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'historyState',
              canUndo: canUndo,
              canRedo: canRedo
            }));
          } catch (e) {
            console.error('Undo/Redo状態確認エラー:', e);
          }
          
          // 状態を定期的に確認
          setTimeout(checkUndoRedoState, 1000);
        }, 500);
        
        true; 
      `;
      richText.current.commandDOM(script);
      
      // MathJaxの初期化スクリプトを追加
      const mathJaxInitScript = `
        (function() {
          try {
            // MathJax設定
            if (!window.MathJax) {
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                  processEscapes: true,
                  processEnvironments: true
                },
                options: {
                  ignoreHtmlClass: 'tex2jax_ignore',
                  processHtmlClass: 'tex2jax_process math-block'
                },
                startup: {
                  ready: () => {
                    MathJax.startup.defaultReady();
                    console.log('MathJax ready for math rendering');
                  }
                }
              };
              
              // MathJaxライブラリを動的に読み込み
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
              script.async = true;
              document.head.appendChild(script);
              
              console.log('MathJax script added to document');
            }
          } catch (e) {
            console.error('MathJax initialization error:', e);
          }
          return true;
        })();
      `;
      richText.current.commandDOM(mathJaxInitScript);
      
      // ハイライトスタイルの初期化
      initializeHighlightStyles();
      
      // 初期化時に履歴状態を確認
      setTimeout(() => {
        checkHistoryState();
        checkFormatState();
      }, 500);
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

  // Undo/Redo状態変更時に親コンポーネントに通知
  useEffect(() => {
    if (onHistoryStateChange) {
      onHistoryStateChange(canUndo, canRedo);
    }
  }, [canUndo, canRedo, onHistoryStateChange]);

  // 標準のRichToolbarアクションをインターセプトして処理するための関数
  const handleRichToolbarAction = useCallback((action: string, selected: boolean) => {
    console.log(`WebViewEditor: アクション実行: ${action}, selected: ${selected}`);
    
    // アクションに応じてカスタム処理を実行
    switch (action) {
      case actions.heading1:
        handleCustomHeadingOne();
        return true; // アクションを処理したことを示す
      case actions.heading2:
        handleCustomHeadingTwo();
        return true;
      case actions.heading3:
        handleCustomHeadingThree();
        return true;
      case actions.blockquote:
        handleCustomBlockquote();
        return true;
      case actions.insertOrderedList:
        handleCustomOrderedList();
        return true;
      case actions.insertBulletsList:
        handleCustomBulletsList();
        return true;
      case actions.checkboxList:
        handleCustomCheckboxList();
        return true;
      default:
        return false; // 標準の処理に委ねる
    }
  }, []);
  
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
          customAction={customActions}
          selectedIconTint={colors.primary}
          unselectedIconTint={calculatedIsDarkMode ? '#ffffff' : '#24292f'}
          disabledIconTint={calculatedIsDarkMode ? '#6e7681' : '#8c959f'}
          style={[styles.toolbar, { 
            backgroundColor: calculatedIsDarkMode ? '#21262d' : '#f6f8fa',
            borderBottomColor: calculatedIsDarkMode ? '#30363d' : '#d0d7de',
          }]}
          itemStyle={{ 
            paddingHorizontal: 12, 
            paddingVertical: 8,
            marginHorizontal: 2,
            borderRadius: 6,
          }}
          iconSize={20}
          onPressAddImage={() => { console.log("WebViewEditor: onPressAddImage"); }} 
          onInsertLink={() => { console.log("WebViewEditor: onInsertLink"); }} 
          onHeading1={handleCustomHeadingOne}
          onHeading2={handleCustomHeadingTwo}
          onHeading3={handleCustomHeadingThree}
          onBlockquote={handleCustomBlockquote}
          onOrderedList={handleCustomOrderedList}
          onUnorderedList={handleCustomBulletsList}
          onCheckboxList={() => {
            console.log("WebViewEditor: onCheckboxList called");
            handleCustomCheckboxList();
          }}
          highlight={handleHighlight}
          undo={handleUndo}
          redo={handleRedo}
          onAction={handleRichToolbarAction}
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
        onMessage={handleWebViewMessage}
        {...androidSpecificProps}
        {...iosSpecificProps}
      />
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  editor: {
    flex: 1,
  },
});

export default WebViewEditor; 