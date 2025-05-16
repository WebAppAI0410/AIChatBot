import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import debounce from 'lodash/debounce';

// Define explicit orientation type
export type OrientationType = 'portrait' | 'landscape';

// Define provider state interface
export interface OrientationState {
  isLandscape: boolean;
  orientation: OrientationType;
  width: number;
  height: number;
}

// Create context with default values
const OrientationContext = createContext<OrientationState>({
  isLandscape: false,
  orientation: 'portrait',
  width: 0,
  height: 0,
});

/**
 * Hook to access orientation information
 * @returns Current orientation state
 */
export const useOrientation = (): OrientationState => useContext(OrientationContext);

interface OrientationProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component to track device orientation changes
 */
export const OrientationProvider: React.FC<OrientationProviderProps> = ({ children }) => {
  // Initialize state with current dimensions
  const [orientationState, setOrientationState] = useState<OrientationState>(() => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    return {
      isLandscape,
      orientation: isLandscape ? 'landscape' : 'portrait',
      width,
      height,
    };
  });

  // Create debounced handler with proper cleanup
  useEffect(() => {
    const handleChange = debounce((dimensions: { window: ScaledSize }) => {
      const { width, height } = dimensions.window;
      const isLandscape = width > height;
      setOrientationState({
        isLandscape,
        orientation: isLandscape ? 'landscape' : 'portrait',
        width,
        height,
      });
    }, 100);

    const subscription = Dimensions.addEventListener('change', handleChange);
    
    // Clean up subscription and debounced function
    return () => {
      subscription.remove();
      handleChange.cancel();
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => orientationState, [orientationState]);

  return (
    <OrientationContext.Provider 
      value={contextValue}
    >
      {children}
    </OrientationContext.Provider>
  );
};

export default OrientationProvider; 