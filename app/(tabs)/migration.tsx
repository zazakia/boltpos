import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function MigrationScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runMigration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // First, let's check if the column already exists
      const { data: columns, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: 'profiles' });
      
      if (!columnError && columns && columns.some((col: any) => col.column_name === 'active')) {
        setResult('The "active" column already exists in the profiles table.');
        setLoading(false);
        return;
      }
      
      // If column doesn't exist, add it
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        setResult(`Error checking profiles table: ${error.message}`);
        setLoading(false);
        return;
      }
      
      // Try to add the column using raw SQL
      const { error: migrationError } = await supabase
        .rpc('exec', {
          sql: `
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL;
            UPDATE profiles SET active = true WHERE active IS NULL;
            CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active);
          `
        });
      
      if (migrationError) {
        // Try a simpler approach - just update the table structure
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            // This will fail if the column doesn't exist, which is what we want
            active: true 
          })
          .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
        
        if (updateError && updateError.message.includes('column "active" does not exist')) {
          setResult('The "active" column does not exist in the database. Please run the migration manually in your Supabase dashboard:\n\n1. Go to your Supabase project\n2. Navigate to SQL Editor\n3. Run the following SQL:\n\nALTER TABLE profiles ADD COLUMN active boolean DEFAULT true NOT NULL;\nUPDATE profiles SET active = true WHERE active IS NULL;\nCREATE INDEX idx_profiles_active ON profiles(active);');
        } else {
          setResult('The "active" column already exists in the profiles table.');
        }
      } else {
        setResult('Migration completed successfully! The "active" column has been added to the profiles table.');
      }
    } catch (error: any) {
      setResult(`Error running migration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Database Migration</Text>
        <Text style={styles.description}>
          This screen will add the "active" column to the profiles table, which is needed for user management functionality.
        </Text>
        
        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={runMigration}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Run Migration</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});