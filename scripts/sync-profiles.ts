/**
 * Profile Sync Utility
 * 
 * This script helps sync auth.users with profiles table
 * Run with: npx tsx scripts/sync-profiles.ts
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncAllProfiles() {
  console.log('🔄 Starting profile sync...\n');

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    console.log(`📊 Found ${authUsers.users.length} auth users\n`);

    // Get existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');
    
    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    const existingProfileIds = new Set(profiles?.map(p => p.id) || []);
    console.log(`📊 Found ${existingProfileIds.size} existing profiles\n`);

    // Find users without profiles
    const usersWithoutProfiles = authUsers.users.filter(
      user => !existingProfileIds.has(user.id)
    );

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ All users have profiles! No sync needed.\n');
      return;
    }

    console.log(`🔧 Creating profiles for ${usersWithoutProfiles.length} users:\n`);

    // Create profiles for users that don't have them
    for (const user of usersWithoutProfiles) {
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          role: 'staff',
          active: true
        });

      if (insertError) {
        console.error(`   ❌ Failed to create profile for ${user.email}: ${insertError.message}`);
      } else {
        console.log(`   ✅ Created profile for ${user.email}`);
      }
    }

    console.log('\n✨ Profile sync completed!\n');
    
    // Summary
    console.log('📋 Summary:');
    console.log(`   Total auth users: ${authUsers.users.length}`);
    console.log(`   Profiles created: ${usersWithoutProfiles.length}`);
    console.log(`   Total profiles now: ${existingProfileIds.size + usersWithoutProfiles.length}`);

  } catch (error) {
    console.error('\n❌ Error during sync:', error);
    process.exit(1);
  }
}

async function syncSpecificUser(email: string) {
  console.log(`🔄 Syncing profile for: ${email}\n`);

  try {
    // Find user by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    const user = authUsers.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    console.log(`✅ Found user: ${user.email} (${user.id})\n`);

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      console.log('ℹ️  Profile already exists:');
      console.log(`   Email: ${existingProfile.email}`);
      console.log(`   Name: ${existingProfile.full_name}`);
      console.log(`   Role: ${existingProfile.role}`);
      console.log(`   Active: ${existingProfile.active}\n`);
      return;
    }

    // Create profile
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        role: 'staff',
        active: true
      });

    if (insertError) {
      console.error(`❌ Failed to create profile: ${insertError.message}`);
    } else {
      console.log('✅ Profile created successfully!\n');
    }

  } catch (error) {
    console.error('\n❌ Error during sync:', error);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length > 0 && args[0] !== '--all') {
  // Sync specific user by email
  syncSpecificUser(args[0]);
} else {
  // Sync all users
  syncAllProfiles();
}
