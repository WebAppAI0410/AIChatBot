import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export interface TipTapEditorHandle {
  setContent: (html: string) => void;
}

interface TipTapEditorProps {
  content: string;
  onContentChange: (html: string) => void;
  autoFocus?: boolean;
}

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.jsdelivr.net/npm/@tiptap/core@2.0.0-beta.251/dist/index.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tiptap/starter-kit@2.0.0-beta.251/dist/index.umd.min.js"></script>
  <style>
    body { margin: 0; padding: 8px; font-family: sans-serif; }
    #editor { min-height: 100vh; outline: none; }
  </style>
</head>
<body>
  <div id="editor"></div>
  <script>
    const editor = new window.tiptap.Editor({
      element: document.getElementById('editor'),
      extensions: [window.tiptapStarterKit.StarterKit],
      content: '',
      onUpdate({ editor }) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'content',
          content: editor.getHTML()
        }));
      }
    });

    function handleMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'setContent') {
          editor.commands.setContent(data.content || '');
        } else if (data.type === 'focus') {
          setTimeout(() => editor.commands.focus('end'), 0);
        }
      } catch (e) {}
    }

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
  </script>
</body>
</html>`;

const TipTapEditor = forwardRef<TipTapEditorHandle, TipTapEditorProps>(
  ({ content, onContentChange, autoFocus }, ref) => {
    const webviewRef = useRef<WebView>(null);
    const [ready, setReady] = useState(false);

    useImperativeHandle(ref, () => ({
      setContent(html: string) {
        webviewRef.current?.postMessage(
          JSON.stringify({ type: 'setContent', content: html })
        );
      },
    }));

    useEffect(() => {
      if (ready) {
        webviewRef.current?.postMessage(
          JSON.stringify({ type: 'setContent', content })
        );
        if (autoFocus) {
          webviewRef.current?.postMessage(
            JSON.stringify({ type: 'focus' })
          );
        }
      }
    }, [content, ready, autoFocus]);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'content') {
          onContentChange(data.content);
        } else if (data.type === 'ready') {
          setReady(true);
        }
      } catch (e) {}
    };

    return (
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
      />
    );
  }
);

export default TipTapEditor;
