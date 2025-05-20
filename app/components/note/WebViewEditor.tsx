import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { XStack } from 'tamagui';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Highlighter,
  RotateCcw,
  RotateCw,
} from 'lucide-react-native';
import { useColors } from '../../constants/colors';

export type WebViewEditorProps = {
  content: string;
  onContentChange: (html: string) => void;
  themeColors?: any;
};

const editorSource = Platform.select({
  ios: require('../../assets/editor/tiptap-editor.html'),
  android: require('../../assets/editor/tiptap-editor.html'),
  default: require('../../assets/editor/tiptap-editor.html'),
});

export type WebViewEditorRef = {
  undo: () => void;
  redo: () => void;
};

const actions = [
  'heading1',
  'heading2',
  'heading3',
  'blockquote',
  'bold',
  'italic',
  'underline',
  'strike',
  'highlight',
  'orderedList',
  'bulletList',
  'undo',
  'redo',
];

const WebViewEditor = forwardRef<WebViewEditorRef, WebViewEditorProps>(
  ({ content, onContentChange, themeColors }, ref) => {
    const webviewRef = useRef<WebView>(null);
    const colors = useColors();

    const send = (data: any) => {
      webviewRef.current?.postMessage(JSON.stringify(data));
    };

    useImperativeHandle(ref, () => ({
      undo: () => send({ type: 'exec', command: 'undo' }),
      redo: () => send({ type: 'exec', command: 'redo' }),
    }));

    useEffect(() => {
      send({ type: 'init', content, colors: themeColors || colors });
    }, [content, themeColors, colors]);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'contentChange') {
          onContentChange(data.content);
        }
      } catch (e) {
        console.warn('WebView message error', e);
      }
    };

    const handleAction = (action: string) => {
      switch (action) {
        case 'heading1':
          send({ type: 'exec', command: 'toggleHeading', value: 1 });
          break;
        case 'heading2':
          send({ type: 'exec', command: 'toggleHeading', value: 2 });
          break;
        case 'heading3':
          send({ type: 'exec', command: 'toggleHeading', value: 3 });
          break;
        case 'orderedList':
          send({ type: 'exec', command: 'toggleOrderedList' });
          break;
        case 'bulletList':
          send({ type: 'exec', command: 'toggleBulletList' });
          break;
        case 'blockquote':
          send({ type: 'exec', command: 'toggleBlockquote' });
          break;
        case 'bold':
          send({ type: 'exec', command: 'toggleBold' });
          break;
        case 'italic':
          send({ type: 'exec', command: 'toggleItalic' });
          break;
        case 'underline':
          send({ type: 'exec', command: 'toggleUnderline' });
          break;
        case 'strike':
          send({ type: 'exec', command: 'toggleStrike' });
          break;
        case 'highlight':
          send({ type: 'exec', command: 'toggleHighlight' });
          break;
        case 'undo':
          send({ type: 'exec', command: 'undo' });
          break;
        case 'redo':
          send({ type: 'exec', command: 'redo' });
          break;
        default:
          break;
      }
    };

    const renderButton = (action: string) => {
      const iconColor = colors.text;
      const size = 20;
      let Icon: any;
      switch (action) {
        case 'bold':
          Icon = Bold;
          break;
        case 'italic':
          Icon = Italic;
          break;
        case 'underline':
          Icon = Underline;
          break;
        case 'strike':
          Icon = Strikethrough;
          break;
        case 'orderedList':
          Icon = ListOrdered;
          break;
        case 'bulletList':
          Icon = List;
          break;
        case 'heading1':
          Icon = Heading1;
          break;
        case 'heading2':
          Icon = Heading2;
          break;
        case 'heading3':
          Icon = Heading3;
          break;
        case 'blockquote':
          Icon = Quote;
          break;
        case 'highlight':
          Icon = Highlighter;
          break;
        case 'undo':
          Icon = RotateCcw;
          break;
        case 'redo':
          Icon = RotateCw;
          break;
        default:
          return null;
      }
      return (
        <Pressable key={action} onPress={() => handleAction(action)} style={styles.button}>
          <Icon size={size} color={iconColor} />
        </Pressable>
      );
    };

    return (
      <View style={styles.container}>
        <XStack gap={8} style={styles.toolbar}>
          {actions.map(renderButton)}
        </XStack>
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={editorSource as any}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          style={styles.webview}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { flexDirection: 'row', padding: 8, flexWrap: 'wrap' },
  webview: { flex: 1 },
  button: { padding: 6 },
});

export default WebViewEditor;
