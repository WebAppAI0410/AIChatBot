import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import useColors from '../constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const email = useStore(state => state.email);
  const plan = useStore(state => state.plan);
  const theme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);
  const localModelStatus = useStore(state => state.localModelStatus);
  const colors = useColors();
  
  const handleThemeChange = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };
  
  const navigateToSubscription = () => {
    router.push('/settings/subscription');
  };
  
  const navigateToLocalModel = () => {
    router.push('/settings/local-model');
  };
  
  const handleSignIn = () => {
    alert('認証モーダルを表示');
  };
  
  const handleSignOut = () => {
    useStore.setState({ 
      isAuthenticated: false,
      userId: null,
      email: null
    });
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.darkGray,
      marginBottom: 16,
      textTransform: 'uppercase',
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    profileInfo: {
      flex: 1,
    },
    profileEmail: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    profilePlan: {
      fontSize: 14,
      color: colors.darkGray,
    },
    signOutButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.lightGray,
    },
    signOutText: {
      fontSize: 14,
      color: colors.darkGray,
    },
    signInButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      justifyContent: 'center',
    },
    signInText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuIcon: {
      marginRight: 16,
    },
    menuText: {
      fontSize: 16,
    },
    menuItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modelStatusBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    modelStatusText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: 'bold',
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    infoLabel: {
      fontSize: 16,
    },
    infoValue: {
      fontSize: 16,
      color: colors.darkGray,
    },
  });
  
  return (
    <ScrollView style={styles.container}>
      {/* User Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント</Text>
        
        {isAuthenticated ? (
          <View style={styles.profileContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.background} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileEmail}>{email}</Text>
              <Text style={styles.profilePlan}>
                {plan === 'free' ? 'フリープラン' : 
                 plan === 'lite' ? 'Liteプラン' : 'Heavyプラン'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Text style={styles.signOutText}>ログアウト</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Ionicons name="log-in-outline" size={24} color={colors.background} />
            <Text style={styles.signInText}>ログイン / 登録</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Subscription */}
      <TouchableOpacity style={styles.menuItem} onPress={navigateToSubscription}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="card-outline" size={24} color={colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuText}>サブスクリプション</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray} />
      </TouchableOpacity>
      
      {/* Local Model */}
      <TouchableOpacity style={styles.menuItem} onPress={navigateToLocalModel}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="save-outline" size={24} color={colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuText}>ローカルモデル管理</Text>
        </View>
        <View style={styles.menuItemRight}>
          {localModelStatus === 'ready' ? (
            <View style={styles.modelStatusBadge}>
              <Text style={styles.modelStatusText}>インストール済み</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
          )}
        </View>
      </TouchableOpacity>
      
      {/* Theme */}
      <View style={styles.menuItem}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="moon-outline" size={24} color={colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuText}>ダークモード</Text>
        </View>
        <Switch
          value={theme === 'dark'}
          onValueChange={handleThemeChange}
          trackColor={{ false: colors.lightGray, true: `${colors.primary}80` }}
          thumbColor={theme === 'dark' ? colors.primary : colors.gray}
        />
      </View>
      
      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ情報</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>バージョン</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <TouchableOpacity style={styles.infoItem}>
          <Text style={styles.infoLabel}>プライバシーポリシー</Text>
          <Ionicons name="open-outline" size={20} color={colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.infoItem}>
          <Text style={styles.infoLabel}>利用規約</Text>
          <Ionicons name="open-outline" size={20} color={colors.gray} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
