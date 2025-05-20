import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export type WebViewEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  isDarkMode?: boolean;
  themeColors?: any;
  autoFocus?: boolean;
  placeholder?: string;
};

export type WebViewEditorRef = {
  setContent: (html: string) => void;
};

const WebViewEditor = forwardRef<WebViewEditorRef, WebViewEditorProps>(({
  content,
  onContentChange,
  isDarkMode = false,
  themeColors,
  autoFocus = false,
  placeholder = '',
}, ref) => {
  const webviewRef = useRef<WebView>(null);
  const source = Platform.select({
    ios: require('../../assets/editor/tiptap.html'),
    android: require('../../assets/editor/tiptap.html'),
    default: { uri: '/assets/editor/tiptap.html' },
  });

  useImperativeHandle(ref, () => ({
    setContent: (html: string) => {
      webviewRef.current?.postMessage(JSON.stringify({ type: 'setContent', content: html }));
    },
  }));

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'contentChanged') {
        onContentChange(data.content);
      } else if (data.type === 'editorReady') {
        webviewRef.current?.postMessage(
          JSON.stringify({
            type: 'init',
            content,
            isDarkMode,
            colors: themeColors,
            autoFocus,
            placeholder,
          }),
        );
      }
    } catch (e) {
      console.error('WebView message error', e);
    }
  };

  useEffect(() => {
    webviewRef.current?.postMessage(
      JSON.stringify({ type: 'updateTheme', colors: themeColors, isDarkMode }),
    );
  }, [themeColors, isDarkMode]);

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={['*']}
      source={source as any}
      onMessage={handleMessage}
      hideKeyboardAccessoryView
      keyboardDisplayRequiresUserAction={false}
    />
  );
});

export default WebViewEditor;
