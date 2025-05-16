import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import theme from './theme';
import useColors from '../constants/colors';

type ThemeContextType = {
  theme: typeof theme;
  colors: ReturnType<typeof useColors>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colors = useColors();
  
  const contextValue = useMemo(() => ({
    theme,
    colors,
  }), [colors]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
