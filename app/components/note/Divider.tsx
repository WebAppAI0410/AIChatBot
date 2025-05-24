import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DividerProps {
  isDarkMode?: boolean;
  thickness?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

const Divider: React.FC<DividerProps> = ({ 
  isDarkMode = false,
  thickness = 2,
  style = 'solid'
}) => {
  const getLineStyle = () => {
    switch (style) {
      case 'dashed':
        return 'dashed';
      case 'dotted':
        return 'dotted';
      default:
        return 'solid';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.line,
        {
          borderBottomWidth: thickness,
          borderBottomColor: isDarkMode ? '#30363d' : '#d0d7de',
          borderStyle: getLineStyle(),
        }
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 0,
  },
  line: {
    width: '100%',
  },
});

export default Divider;