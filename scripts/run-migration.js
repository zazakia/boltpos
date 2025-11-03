/**
 * Supabase Migration Runner
 *
 * This script applies the voucher system migration to your Supabase database.
 *
 * Requirements:
 * - Node.js installed
 * - @supabase/supabase-js package
 * - SUPABASE_SERVICE_ROLE_KEY environment variable (not the anon key!)
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/run-migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fuvtlstscqnizcxpuxel.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('You can find your service role key in:');
  console.error('Supabase Dashboard → Project Settings → API → service_role key');
  console.error('');
  console.error('Usage:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/run-migration.js');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Starting voucher system migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251103000000_create_voucher_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Read migration file: 20251103000000_create_voucher_system.sql');
    console.log(`   Size: ${migrationSQL.length} characters\n`);

    console.log('❌ Cannot execute migration directly via JavaScript client.');
    console.log('');
    console.log('📝 Please use one of these methods instead:');
    console.log('');
    console.log('Method 1: Supabase Dashboard (Recommended & Easiest)');
    console.log('  1. Go to https://app.supabase.com');
    console.log('  2. Open your project');
    console.log('  3. Navigate to SQL Editor');
    console.log('  4. Copy contents from: supabase/migrations/20251103000000_create_voucher_system.sql');
    console.log('  5. Paste and click Run');
    console.log('');
    console.log('Method 2: Supabase CLI');
    console.log('  1. Install: npm install -g supabase');
    console.log('  2. Link: supabase link --project-ref fuvtlstscqnizcxpuxel');
    console.log('  3. Push: supabase db push');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Please see MIGRATION_INSTRUCTIONS.md for detailed instructions.');
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
