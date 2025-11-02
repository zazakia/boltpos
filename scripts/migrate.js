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
    console.log('Checking if profiles table exists...');
    
    // First, let's try to select from profiles table to see if it exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id, active')
      .limit(1);
    
    if (error && error.message.includes('Could not find the table')) {
      console.log(`
====================================
COMPLETE DATABASE SETUP REQUIRED
====================================

It seems your database tables haven't been created yet. Please run the following SQL in your Supabase SQL Editor:

1. Go to your Supabase project dashboard: https://vrtifeegylanzeicgoaq.supabase.co
2. Navigate to "SQL Editor" in the sidebar
3. Click "New query"
4. Paste and execute the following SQL in order:

-- First, run the main schema creation
${require('fs').readFileSync('./supabase/migrations/20251027152034_create_pos_schema.sql', 'utf8')}

-- Then, run the active field migration
${require('fs').readFileSync('./supabase/migrations/20251029000000_add_profiles_active_field.sql', 'utf8')}

-- Finally, run the stock functions
${require('fs').readFileSync('./supabase/migrations/20251028173500_add_stock_functions.sql', 'utf8')}

${require('fs').readFileSync('./supabase/migrations/20251028180000_add_batch_stock_function.sql', 'utf8')}

5. After running all the SQL, restart your Expo app
====================================
      `);
    } else if (error && error.message.includes('column "active" does not exist')) {
      console.log(`
====================================
ACTIVE COLUMN MIGRATION REQUIRED
====================================

The profiles table exists but the active column is missing. Please run the following SQL in your Supabase SQL Editor:

1. Go to your Supabase project dashboard: https://vrtifeegylanzeicgoaq.supabase.co
2. Navigate to "SQL Editor" in the sidebar
3. Click "New query"
4. Paste and execute the following SQL:

${require('fs').readFileSync('./supabase/migrations/20251029000000_add_profiles_active_field.sql', 'utf8')}

5. After running the SQL, restart your Expo app
====================================
      `);
    } else if (error) {
      console.error('Error checking profiles table:', error);
    } else {
      console.log('Success! The profiles table and active column already exist.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

runMigration();