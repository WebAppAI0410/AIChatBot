import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
}

export default function BreadcrumbNavigation({ items, onNavigate }: BreadcrumbNavigationProps) {
  const colors = useColors();

  if (items.length <= 1) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    breadcrumbContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 32,
    },
    breadcrumbItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    breadcrumbButton: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: 'transparent',
    },
    breadcrumbButtonActive: {
      backgroundColor: colors.primary + '15',
    },
    breadcrumbText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    breadcrumbTextCurrent: {
      color: colors.text,
      fontWeight: '600',
    },
    separator: {
      marginHorizontal: 4,
    },
    separatorIcon: {
      opacity: 0.6,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.breadcrumbContainer}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isClickable = !isLast;

            return (
              <View key={item.id || 'root'} style={styles.breadcrumbItem}>
                <TouchableOpacity
                  style={[
                    styles.breadcrumbButton,
                    isClickable && styles.breadcrumbButtonActive,
                  ]}
                  onPress={() => isClickable && onNavigate(item.id)}
                  disabled={!isClickable}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.breadcrumbText,
                      isLast && styles.breadcrumbTextCurrent,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>

                {!isLast && (
                  <View style={styles.separator}>
                    <MaterialIcons
                      name="chevron-right"
                      size={16}
                      color={colors.gray}
                      style={styles.separatorIcon}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}