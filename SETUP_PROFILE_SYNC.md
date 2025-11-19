# 🚀 Quick Setup: Profile Sync System

## Step 1: Apply the Database Migration

Run this SQL in your **Supabase SQL Editor**:

```bash
# Option A: If you have Supabase CLI installed
cd "C:\Users\HI\Documents\GitHub\_deve local\_EXPO apps\boltposExpo"
supabase db push

# Option B: Manual SQL execution
# Copy the contents of:
# supabase/migrations/20251113000000_add_auto_profile_sync.sql
# Paste into Supabase Dashboard > SQL Editor > Run
```

## Step 2: Change cybergada@gmail.com to Admin

### Option A: Using Supabase Dashboard (Easiest)
1. Open Supabase Dashboard
2. Go to **Table Editor** → **profiles**
3. Find row with `email = 'cybergada@gmail.com'`
4. Click the **role** cell
5. Change from `staff` to `admin`
6. Press Enter to save

### Option B: Using SQL Query
```sql
-- Change role to admin
UPDATE profiles 
SET role = 'admin',
    updated_at = now()
WHERE email = 'cybergada@gmail.com';

-- Verify the change
SELECT id, email, full_name, role, active 
FROM profiles 
WHERE email = 'cybergada@gmail.com';
```

### Option C: Using the Sync Script
```bash
# If the user doesn't have a profile yet, create it first
npx tsx scripts/sync-profiles.ts cybergada@gmail.com

# Then update the role using Option A or B above
```

## Step 3: Verify Everything Works

### Check Sync Status
```sql
-- See all users and their profiles
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  p.role,
  p.active,
  CASE WHEN p.id IS NULL THEN '❌ Missing' ELSE '✅ Synced' END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

### Test in the App
1. Log out if currently logged in
2. Log in as `cybergada@gmail.com`
3. Check that you now have admin permissions
4. Navigate to Users tab (should be visible now)

## What Was Fixed

### ✅ Automatic Profile Creation
- Database trigger now automatically creates profiles for new users
- No manual intervention needed after signup

### ✅ Email Synchronization  
- Email changes in auth.users automatically update profiles table
- Keeps data consistent across both tables

### ✅ Existing Users Support
- `sync_existing_users()` function creates profiles for existing auth users
- No data loss for users created before the migration

### ✅ Robust Error Handling
- App code now handles duplicate profile creation gracefully
- Trigger failures don't break user signup
- Comprehensive logging for debugging

## Files Created/Modified

### New Files:
- `supabase/migrations/20251113000000_add_auto_profile_sync.sql` - Database trigger
- `scripts/sync-profiles.ts` - Manual sync utility
- `docs/PROFILE_SYNC.md` - Comprehensive documentation
- `update-user-role.sql` - Quick SQL helper

### Modified Files:
- `services/auth.service.ts` - Improved profile creation with fallback

## Troubleshooting

### If user still doesn't have a profile:
```bash
npx tsx scripts/sync-profiles.ts cybergada@gmail.com
```

### If you need to sync all users:
```bash
npx tsx scripts/sync-profiles.ts
```

### If the role change doesn't reflect in the app:
1. Log out completely
2. Close the app
3. Reopen and log back in
4. The profile will be reloaded with the new role

## Next Steps

1. ✅ Apply the migration
2. ✅ Change cybergada@gmail.com to admin role
3. ✅ Test login with admin user
4. ✅ Verify admin features are accessible
5. 📖 Read full documentation in `docs/PROFILE_SYNC.md`
