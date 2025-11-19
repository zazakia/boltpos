import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  showRetryButton?: boolean;
  customMessage?: string;
}

type LoadingState = 'loading' | 'error' | 'timeout' | 'complete';

export default function LoadingScreen({
  onLoadingComplete,
  showRetryButton = true,
  customMessage,
}: LoadingScreenProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [progress, setProgress] = useState<string>('Initializing...');
  const router = useRouter();

  // Add timeout protection
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loadingState === 'loading') {
        setLoadingState('timeout');
        setErrorMessage(
          'Loading is taking longer than expected. Please check your connection.',
        );
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loadingState]);

  // Check connectivity and initialize
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoadingState('loading');
      setProgress('Checking connection...');

      // Test Supabase connectivity
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        console.error('LoadingScreen: Supabase connection error:', error);
        setErrorMessage(
          'Connection error. Please check your internet connection.',
        );
        setLoadingState('error');
        return;
      }

      setProgress('Connection successful');

      // Allow a brief moment for the auth state to settle
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setLoadingState('complete');
      onLoadingComplete?.();
    } catch (error) {
      console.error('LoadingScreen: Initialization error:', error);
      setErrorMessage('Failed to initialize app. Please try again.');
      setLoadingState('error');
    }
  };

  const handleRetry = () => {
    setErrorMessage('');
    setLoadingState('loading');
    initializeApp();
  };

  const handleSkipToLogin = () => {
    try {
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('LoadingScreen: Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to navigate. Please restart the app.',
      );
    }
  };

  const renderLoadingContent = () => {
    switch (loadingState) {
      case 'loading':
        return (
          <>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>
              {customMessage || 'Loading ZapPOS...'}
            </Text>
            <Text style={styles.progressText}>{progress}</Text>
          </>
        );

      case 'error':
        return (
          <>
            <Text style={styles.errorTitle}>Loading Error</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            {showRetryButton && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.retryButton]}
                  onPress={handleRetry}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.skipButton]}
                  onPress={handleSkipToLogin}
                >
                  <Text style={styles.skipButtonText}>Continue to Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        );

      case 'timeout':
        return (
          <>
            <Text style={styles.errorTitle}>Loading Timeout</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={handleRetry}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'complete':
        return (
          <>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.successText}>Ready!</Text>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>ZapPOS</Text>
        {renderLoadingContent()}
      </View>

      {/* Debug information - remove in production */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>State: {loadingState}</Text>
          <Text style={styles.debugText}>Progress: {progress}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successText: {
    marginTop: 20,
    fontSize: 18,
    color: '#10B981',
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
  },
  skipButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
});
