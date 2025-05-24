import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import useColors from '../../constants/colors';

interface MathRendererProps {
  latex: string;
  inline?: boolean;
  isDarkMode?: boolean;
}

const MathRenderer: React.FC<MathRendererProps> = ({ 
  latex, 
  inline = false, 
  isDarkMode = false 
}) => {
  const colors = useColors();
  const [webViewHeight, setWebViewHeight] = useState(inline ? 30 : 60);
  const { width } = Dimensions.get('window');

  const mathJaxHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
      <script>
        window.MathJax = {
          tex: {
            inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
            displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
            processEscapes: true,
            processEnvironments: true
          },
          options: {
            ignoreHtmlClass: 'tex2jax_ignore',
            processHtmlClass: 'tex2jax_process'
          },
          startup: {
            ready: () => {
              MathJax.startup.defaultReady();
              MathJax.startup.promise.then(() => {
                // 高さを計算して親に送信
                const height = Math.max(document.body.scrollHeight, 30);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'resize',
                  height: height
                }));
              });
            }
          }
        };
      </script>
      <style>
        body {
          margin: 0;
          padding: ${inline ? '4px 8px' : '8px 12px'};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background-color: ${isDarkMode ? '#0d1117' : '#ffffff'};
          color: ${isDarkMode ? '#c9d1d9' : '#24292f'};
          font-size: ${inline ? '14px' : '16px'};
          line-height: 1.6;
          overflow-x: auto;
          overflow-y: hidden;
        }
        
        .math-container {
          ${inline ? 'display: inline-block;' : 'display: block; text-align: center;'}
          max-width: 100%;
          overflow-x: auto;
        }
        
        .MathJax {
          color: ${isDarkMode ? '#c9d1d9' : '#24292f'} !important;
        }
        
        .MathJax_Display {
          margin: ${inline ? '0' : '0.5em 0'} !important;
        }
        
        mjx-container {
          color: ${isDarkMode ? '#c9d1d9' : '#24292f'} !important;
        }
        
        mjx-container[display="true"] {
          margin: ${inline ? '0' : '0.5em 0'} !important;
        }
      </style>
    </head>
    <body>
      <div class="math-container">
        ${inline ? `$${latex}$` : `$$${latex}$$`}
      </div>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'resize') {
        setWebViewHeight(Math.max(data.height, inline ? 30 : 60));
      }
    } catch (e) {
      console.error('MathRenderer: メッセージ解析エラー:', e);
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        height: webViewHeight,
        backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
        borderColor: isDarkMode ? '#30363d' : '#d0d7de',
      },
      !inline && styles.blockContainer
    ]}>
      <WebView
        source={{ html: mathJaxHTML }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMessage={handleMessage}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        onError={(error) => {
          console.error('MathRenderer WebView エラー:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 30,
    backgroundColor: 'transparent',
  },
  blockContainer: {
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    padding: 4,
  },
  webView: {
    backgroundColor: 'transparent',
  },
});

export default MathRenderer;