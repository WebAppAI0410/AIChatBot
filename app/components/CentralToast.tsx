import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useColors from '../constants/colors';

interface CentralToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

let globalShowCentralToast: (message: string, duration?: number) => void = () => {};

export const CentralToast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const colors = useColors();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    globalShowCentralToast = (msg: string, duration: number = 1500) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setMessage(msg);
      setVisible(true);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setVisible(false);
        });
      }, duration);
    };
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [opacityAnim, scaleAnim]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          { 
            backgroundColor: colors.darkGray || 'rgba(0,0,0,0.8)',
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
        <Text style={styles.messageText}>{message}</Text>
      </Animated.View>
    </View>
  );
};

export const showCentralToast = (message: string, duration?: number) => {
  globalShowCentralToast(message, duration);
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000, // 他の要素より前面に
  },
  container: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
    maxWidth: '80%',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
}); 