import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getApiUrl = () => {
  // If running on web, use relative path
  if (Platform.OS === 'web') {
    return '/api';
  }

  // If running in Expo Go or Dev Client, derive IP from hostUri
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const [ip] = hostUri.split(':');
    // Assuming the server is running on the standard Expo port 8081
    return `http://${ip}:8081/api`;
  }

  // Fallback for production builds (you'd replace this with your actual production URL)
  // For now, we'll return a localhost placeholder which won't work on real devices
  // without port forwarding, but is a safe default for emulators if 10.0.2.2 is needed
  // Android Emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8081/api';
  }
  
  // iOS Simulator
  return 'http://localhost:8081/api';
};
