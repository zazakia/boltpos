const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Anon Key in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration to add active column to profiles table...');
    
    // Execute the SQL from the migration file
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add the active column with default value true
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL;
        
        -- Update existing profiles to be active (for backward compatibility)
        UPDATE profiles SET active = true WHERE active IS NULL;
        
        -- Add index on active field for performance
        CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active);
      `
    });

    if (error) {
      console.error('Error running migration:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

runMigration();