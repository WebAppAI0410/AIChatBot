import Constants from 'expo-constants';

// Determine development mode from environment variables or build settings
export const isDevelopmentMode = () => {
  // For Expo environment
  if (Constants.expoConfig?.extra?.isDev) {
    return true;
  }

  // __DEV__ global variable (React Native)
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return true;
  }

  // Process environment variables (Node.js)
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
};

export default { isDevelopmentMode }; 