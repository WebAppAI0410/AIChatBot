import React, { useRef, useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { YStack } from 'tamagui';
import { Edit } from 'lucide-react-native';

// デフォルトのHTMLエディタ（将来的にはassets/editor/editor.htmlから読み込む）
const DEFAULT_EDITOR_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 16px;
      margin: 0;
      color: #333;
      -webkit-overflow-scrolling: touch;
      background-color: #fff;
    }
    
    #editor {
      outline: none;
      min-height: 90vh;
    }
    
    p {
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.5;
    }
    
    .selection-bubble {
      position: absolute;
      background: #007aff;
      color: white;
      padding: 8px 12px;
      border-radius: 16px;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div id="editor" contenteditable="true"></div>
  
  <script>
    // エディタの初期化
    const editor = document.getElementById('editor');
    let lastContent = '';
    let selectionTimeout;
    let isEditing = false;
    
    // 選択テキストのポジション取得
    function getSelectionCoordinates() {
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return null;
      
      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      if (rects.length === 0) return null;
      
      // 最後の選択範囲の下に表示
      const lastRect = rects[rects.length - 1];
      
      return {
        left: lastRect.left + (lastRect.width / 2),
        top: lastRect.bottom + 10,
        text: selection.toString()
      };
    }
    
    // 選択テキストのアクションバブル
    function showSelectionBubble() {
      // 既存のバブルを削除
      const existingBubble = document.querySelector('.selection-bubble');
      if (existingBubble) existingBubble.remove();
      
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && selectedText.length > 1) {
        const coords = getSelectionCoordinates();
        if (!coords) return;
        
        const bubble = document.createElement('div');
        bubble.className = 'selection-bubble';
        bubble.textContent = 'AIアシスト';
        bubble.style.left = (coords.left - 50) + 'px';
        bubble.style.top = coords.top + 'px';
        
        // バブルクリック時のアクション
        bubble.addEventListener('click', () => {
          // ネイティブに選択テキストとアクション通知
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'textSelection',
            text: selectedText
          }));
          
          bubble.remove();
        });
        
        document.body.appendChild(bubble);
      }
    }
    
    // テキスト選択の監視
    document.addEventListener('selectionchange', () => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        if (!isEditing) showSelectionBubble();
      }, 500);
    });
    
    // タップでの編集開始
    editor.addEventListener('focus', () => {
      isEditing = true;
      const existingBubble = document.querySelector('.selection-bubble');
      if (existingBubble) existingBubble.remove();
      
      // ネイティブに編集開始を通知
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'editingStarted'
      }));
    });
    
    // 編集終了
    editor.addEventListener('blur', () => {
      isEditing = false;
      
      // 内容が変更されていれば保存
      if (editor.innerHTML !== lastContent) {
        lastContent = editor.innerHTML;
        
        // ネイティブに内容変更を通知
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'contentChanged',
          content: lastContent
        }));
      }
    });
    
    // 初期コンテンツの設定とメッセージ処理
    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'setContent') {
          editor.innerHTML = data.content;
          lastContent = data.content;
        }
      } catch (e) {
        console.error('メッセージ処理エラー:', e);
      }
    });
    
    // 準備完了通知
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'editorReady'
    }));
  </script>
</body>
</html>
`;

export type WebViewEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  onTextSelection?: (text: string) => void;
  readOnly?: boolean;
  isDarkMode?: boolean;
  themeColors?: any;
};

const WebViewEditor: React.FC<WebViewEditorProps> = ({
  content,
  onContentChange,
  onTextSelection,
  readOnly = false,
  isDarkMode = false,
  themeColors
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // テーマカラーのデフォルト値
  const colors = themeColors || {
    text: isDarkMode ? '#ffffff' : '#333333',
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    primary: '#007aff',
    border: isDarkMode ? '#444444' : '#eeeeee',
    lightGray: isDarkMode ? '#444444' : '#f5f5f5'
  };
  
  // テーマに合わせたHTMLテンプレートを動的に生成
  const getHtmlTemplate = useMemo(() => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 16px;
          margin: 0;
          color: ${colors.text};
          -webkit-overflow-scrolling: touch;
          background-color: ${colors.background};
        }
        
        #editor {
          outline: none;
          min-height: 90vh;
        }
        
        p {
          margin-top: 0;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        
        .selection-bubble {
          position: absolute;
          background: ${colors.primary};
          color: white;
          padding: 8px 12px;
          border-radius: 16px;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 1000;
        }
      </style>
    </head>
    <body>
      <div id="editor" contenteditable="${!readOnly}"></div>
      
      <script>
        // エディタの初期化
        const editor = document.getElementById('editor');
        let lastContent = '';
        let selectionTimeout;
        let isEditing = false;
        
        // 選択テキストのポジション取得
        function getSelectionCoordinates() {
          const selection = window.getSelection();
          if (selection.rangeCount === 0) return null;
          
          const range = selection.getRangeAt(0);
          const rects = range.getClientRects();
          if (rects.length === 0) return null;
          
          // 最後の選択範囲の下に表示
          const lastRect = rects[rects.length - 1];
          
          return {
            left: lastRect.left + (lastRect.width / 2),
            top: lastRect.bottom + 10,
            text: selection.toString()
          };
        }
        
        // 選択テキストのアクションバブル
        function showSelectionBubble() {
          // 既存のバブルを削除
          const existingBubble = document.querySelector('.selection-bubble');
          if (existingBubble) existingBubble.remove();
          
          const selection = window.getSelection();
          const selectedText = selection.toString().trim();
          
          if (selectedText && selectedText.length > 1) {
            const coords = getSelectionCoordinates();
            if (!coords) return;
            
            const bubble = document.createElement('div');
            bubble.className = 'selection-bubble';
            bubble.textContent = 'AIアシスト';
            bubble.style.left = (coords.left - 50) + 'px';
            bubble.style.top = coords.top + 'px';
            
            // バブルクリック時のアクション
            bubble.addEventListener('click', () => {
              // ネイティブに選択テキストとアクション通知
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'textSelection',
                text: selectedText
              }));
              
              bubble.remove();
            });
            
            document.body.appendChild(bubble);
          }
        }
        
        // テキスト選択の監視
        document.addEventListener('selectionchange', () => {
          clearTimeout(selectionTimeout);
          selectionTimeout = setTimeout(() => {
            if (!isEditing) showSelectionBubble();
          }, 500);
        });
        
        // タップでの編集開始
        editor.addEventListener('focus', () => {
          isEditing = true;
          const existingBubble = document.querySelector('.selection-bubble');
          if (existingBubble) existingBubble.remove();
          
          // ネイティブに編集開始を通知
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'editingStarted'
          }));
        });
        
        // 編集終了
        editor.addEventListener('blur', () => {
          isEditing = false;
          
          // 内容が変更されていれば保存
          if (editor.innerHTML !== lastContent) {
            lastContent = editor.innerHTML;
            
            // ネイティブに内容変更を通知
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'contentChanged',
              content: lastContent
            }));
          }
        });
        
        // 初期コンテンツの設定とメッセージ処理
        window.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'setContent') {
              editor.innerHTML = data.content;
              lastContent = data.content;
            } else if (data.type === 'updateTheme') {
              // テーマ更新
              document.body.style.color = data.colors.text;
              document.body.style.backgroundColor = data.colors.background;
              const bubbles = document.querySelectorAll('.selection-bubble');
              bubbles.forEach(bubble => {
                bubble.style.backgroundColor = data.colors.primary;
              });
            }
          } catch (e) {
            console.error('メッセージ処理エラー:', e);
          }
        });
        
        // 準備完了通知
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'editorReady'
        }));
      </script>
    </body>
    </html>
    `;
  }, [colors, readOnly]);

  // エディタの準備完了後に初期コンテンツを設定
  useEffect(() => {
    if (isEditorReady && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setContent',
        content
      }));
    }
  }, [isEditorReady, content]);
  
  // テーマ変更時にWebViewにも通知
  useEffect(() => {
    if (isEditorReady && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateTheme',
        colors: colors
      }));
    }
  }, [isEditorReady, colors, isDarkMode]);
  
  // メッセージハンドラ
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'editorReady':
          setIsEditorReady(true);
          break;
          
        case 'contentChanged':
          onContentChange(data.content);
          break;
          
        case 'textSelection':
          if (onTextSelection) {
            onTextSelection(data.text);
          }
          break;
          
        case 'editingStarted':
          setIsEditing(true);
          break;
      }
    } catch (e) {
      console.error('WebViewメッセージ処理エラー:', e);
    }
  };
  
  return (
    <YStack flex={1}>
      {!isEditorReady && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        style={[styles.webView, { backgroundColor: colors.background }]}
        source={{ html: getHtmlTemplate }}
        onMessage={handleMessage}
        scrollEnabled={true}
        hideKeyboardAccessoryView={false}
        keyboardDisplayRequiresUserAction={false}
        originWhitelist={['*']}
      />
      
      {isEditing && (
        <View style={[
          styles.editingIndicator, 
          { 
            backgroundColor: isDarkMode ? '#333333' : '#f0f8ff',
            borderColor: colors.border 
          }
        ]}>
          <Edit size={16} color={colors.primary} />
        </View>
      )}
    </YStack>
  );
};

const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  editingIndicator: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
  }
});

export default WebViewEditor; 