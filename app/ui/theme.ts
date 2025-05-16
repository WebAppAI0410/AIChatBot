import { Platform, StatusBar } from 'react-native';

// フォントサイズの一元管理のための定義
const baseFontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

export const theme = {
  colors: {
    primary: '#005E36',
    primaryLight: '#00C26A',
    accentBlue: '#007AFF',
    deleteRed: '#FF3B30',
    warningYellow: '#FFCC00',
    background: {
      light: '#FFFFFF',
      dark: '#121212',
    },
    text: {
      primary: {
        light: '#000000',
        dark: '#FFFFFF',
      },
      secondary: {
        light: '#666666',
        dark: '#AAAAAA',
      },
      inverse: '#FFFFFF',
      light: '#000000',
    },
    gray: {
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#DDDDDD',
      400: '#CCCCCC',
      500: '#AAAAAA',
      600: '#888888',
      700: '#666666',
      800: '#444444',
      900: '#222222',
    },
    border: {
      light: '#DDDDDD',
      dark: '#444444',
    },
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FFCC00',
    info: '#007AFF',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  safeArea: {
    top: Platform.OS === 'ios' ? (StatusBar.currentHeight || 44) : (StatusBar.currentHeight || 0),
    bottom: Platform.OS === 'ios' ? 34 : 0,
    left: 0,
    right: 0,
  },
  
  typography: {
    heading1: {
      fontSize: baseFontSizes.xxl,
      fontWeight: 'bold',
      lineHeight: 32,
    },
    heading2: {
      fontSize: baseFontSizes.xl,
      fontWeight: 'bold',
      lineHeight: 28,
    },
    heading3: {
      fontSize: baseFontSizes.lg,
      fontWeight: 'bold',
      lineHeight: 24,
    },
    body: {
      fontSize: baseFontSizes.md,
      fontWeight: 'normal',
      lineHeight: 22,
    },
    caption: {
      fontSize: baseFontSizes.sm,
      fontWeight: 'normal',
      lineHeight: 18,
    },
    small: {
      fontSize: baseFontSizes.xs,
      fontWeight: 'normal',
      lineHeight: 16,
    },
  },
  
  radius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 9999, // 以前の'round'から命名規則を一致させるように変更
  },
  
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // 共通のフォントサイズ定義を使用
  fontSizes: baseFontSizes,
  
  borderWidth: {
    thin: 1,
    normal: 2,
    thick: 3,
  },
  
  // 共通のコンポーネントサイズを定義
  sizes: {
    input: {
      height: {
        sm: 36,
        md: 48,
        lg: 56,
      },
    },
    icon: {
      sm: 16,
      md: 24,
      lg: 32,
    },
    header: {
      height: 44, // ヘッダーの標準高さ
      backButton: 32, // 戻るボタンサイズ
      verticalAdjust: -4, // 垂直位置調整用
    },
  },
  
  componentStyles: {
    badge: {
      notInstalled: {
        backgroundColor: '#CCCCCC',
      },
      downloading: {
        backgroundColor: '#FFCC00',
      },
      ready: {
        backgroundColor: '#34C759',
      },
      error: {
        backgroundColor: '#FF3B30',
      },
    },
    input: {
      default: {
        borderWidth: 1,
        borderColor: '#DDDDDD',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
      },
      focused: {
        borderColor: '#005E36',
      },
      error: {
        borderColor: '#FF3B30',
      },
    },
    listItem: {
      default: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
      },
      selected: {
        backgroundColor: '#F5F5F5',
      },
    },
    chatBubble: {
      user: {
        backgroundColor: '#005E36',
        borderBottomRightRadius: 2,
      },
      assistant: {
        backgroundColor: '#F5F5F5',
        borderBottomLeftRadius: 2,
      },
    },
    quotaWarning: {
      container: {
        backgroundColor: '#FFF9E6',
        borderWidth: 1,
        borderColor: '#FFCC00',
        borderRadius: 8,
        padding: 16,
        marginVertical: 8,
      },
      text: {
        color: '#664D00',
      },
    },
  },
};

export default theme;
