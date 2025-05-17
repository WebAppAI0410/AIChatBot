module.exports = {
  expo: {
    name: "AIChatBot",
    slug: "AIChatBot",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#005E36"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#005E36"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      "expo-sqlite"
    ],
    scheme: "aichatbot",
    // 環境変数
    extra: {
      supabaseUrl: process.env.SUPABASE_URL || "https://alperyqhdtpnivxfnqdi.supabase.co",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscGVyeXFoZHRwbml2eGZucWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDc5OTcsImV4cCI6MjA2MjM4Mzk5N30.0gTXgFtD2uIhGdSB4twConRJPF_0Ccz5zePqa0hD8B0",
      // 開発時には環境変数が設定されているかを確認するためのメッセージ
      eas: {
        projectId: "your-project-id" // 必要に応じて設定
      }
    }
  }
}; 