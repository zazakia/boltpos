import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Index: App loading state:', loading);
    console.log('Index: Session state:', session ? 'authenticated' : 'not authenticated');
    
    if (!loading) {
      console.log('Index: Navigation decision - session exists:', !!session);
      if (session) {
        console.log('Index: Navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('Index: Navigating to login');
        router.replace('/(auth)/login');
      }
    }
  }, [session, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Loading app...</Text>
      <Text style={styles.debugText}>Loading: {loading ? 'true' : 'false'}</Text>
      <Text style={styles.debugText}>Session: {session ? 'exists' : 'none'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  debugText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
});
