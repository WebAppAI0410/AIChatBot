import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import useColors from '../constants/colors';

interface DeleteConfirmDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  visible, 
  onDismiss, 
  onConfirm, 
  title = 'チャットを削除',
  message = 'このチャットを削除しますか？削除したチャットは復元できません。'
}) => {
  const colors = useColors(); // 動的カラーを取得
  
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dialog: {
      width: '80%',
      backgroundColor: colors.background,
      borderRadius: 16,
      paddingHorizontal: 24,
      paddingVertical: 20,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      textAlign: 'center',
      color: colors.text,
    },
    message: {
      fontSize: 16,
      marginBottom: 24,
      textAlign: 'center',
      color: colors.secondaryText,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      marginRight: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.lightGray,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.secondaryText,
      fontWeight: '600',
    },
    deleteButton: {
      flex: 1,
      paddingVertical: 12,
      marginLeft: 8,
      borderRadius: 8,
      backgroundColor: colors.error,
      alignItems: 'center',
    },
    deleteButtonText: {
      color: 'white',
      fontWeight: '600',
    },
  });
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={onDismiss}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={onConfirm}
                >
                  <Text style={styles.deleteButtonText}>削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default DeleteConfirmDialog; 