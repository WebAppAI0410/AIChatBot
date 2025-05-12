import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

type OrientationState = {
  isLandscape: boolean;
  width: number;
  height: number;
};

const OrientationContext = createContext<OrientationState>({
  isLandscape: false,
  width: 0,
  height: 0,
});

export const useOrientation = () => useContext(OrientationContext);

export const OrientationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [orientation, setOrientation] = useState<OrientationState>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      isLandscape: width > height,
      width,
      height,
    };
  });

  useEffect(() => {
    const handleChange = ({ window }: { window: { width: number; height: number } }) => {
      const { width, height } = window;
      setOrientation({
        isLandscape: width > height,
        width,
        height,
      });
    };

    const subscription = Dimensions.addEventListener('change', handleChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <OrientationContext.Provider value={orientation}>
      {children}
    </OrientationContext.Provider>
  );
};

export default OrientationProvider; 