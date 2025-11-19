# Profile Sync System Documentation

## Overview

The Bolt POS app uses a dual-table authentication system:
- **auth.users** (Supabase Auth) - Managed by Supabase authentication
- **public.profiles** - Custom user profiles with app-specific data

These tables are kept in sync automatically via database triggers.

## How It Works

### 1. Automatic Profile Creation

When a new user signs up, a database trigger automatically creates a profile:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**What happens:**
- User signs up via `auth.signUp()`
- Supabase creates record in `auth.users`
- Trigger fires and creates matching record in `profiles`
- Default role is set to `'staff'`
- Profile is marked as `active: true`

### 2. Email Synchronization

When a user's email changes in `auth.users`, the profile is automatically updated:

```sql
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_update();
```

### 3. Existing Users Sync

For users that existed before the trigger was added, run:

```sql
SELECT public.sync_existing_users();
```

This creates profiles for any `auth.users` that don't have them.

## Profile Schema

```typescript
interface Profile {
  id: string;              // UUID, references auth.users.id
  email: string;           // Synced from auth.users.email
  full_name: string | null;
  role: 'admin' | 'staff'; // User role for permissions
  active: boolean;         // Soft delete flag
  created_at: string;
  updated_at: string;
}
```

## Manual Profile Sync

### Sync All Users

```bash
npx tsx scripts/sync-profiles.ts
```

This will:
1. List all users in `auth.users`
2. Find users without profiles
3. Create missing profiles with default values

### Sync Specific User

```bash
npx tsx scripts/sync-profiles.ts cybergada@gmail.com
```

### Update User Role via SQL

```sql
-- Change user to admin
UPDATE profiles 
SET role = 'admin',
    updated_at = now()
WHERE email = 'cybergada@gmail.com';

-- Verify the change
SELECT id, email, full_name, role, active 
FROM profiles 
WHERE email = 'cybergada@gmail.com';
```

### Update User Role via Supabase Dashboard

1. Go to **Table Editor** → **profiles**
2. Find the user by email
3. Click the role cell and change to `'admin'`
4. Save

## Common Issues & Solutions

### Issue: User has no profile after signup

**Cause:** Trigger not installed or failed

**Solution:**
```bash
# Apply the migration
supabase db push

# Or sync manually
npx tsx scripts/sync-profiles.ts user@example.com
```

### Issue: Email mismatch between auth.users and profiles

**Cause:** Email updated in auth but trigger didn't fire

**Solution:**
```sql
UPDATE profiles 
SET email = (SELECT email FROM auth.users WHERE id = profiles.id),
    updated_at = now()
WHERE id = 'user-uuid';
```

### Issue: Profile exists but role is wrong

**Solution:**
```sql
UPDATE profiles 
SET role = 'admin',
    updated_at = now()
WHERE email = 'user@example.com';
```

## Migration Files

### 20251027000000_create_profiles_table.sql
- Creates `profiles` table
- Sets up foreign key to `auth.users`
- Adds Row Level Security policies

### 20251113000000_add_auto_profile_sync.sql
- Creates `handle_new_user()` trigger function
- Creates `handle_user_email_update()` trigger function
- Creates `sync_existing_users()` utility function
- Sets up automatic sync triggers

## Code Integration

### AuthContext

The `AuthContext` automatically loads the profile after authentication:

```typescript
useEffect(() => {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      loadProfile(session.user.id);
    }
  });
}, []);
```

### Auth Service

The `auth.service.ts` includes fallback profile creation:

```typescript
// This runs AFTER the trigger, as a safety net
const { error: profileError } = await supabase
  .from('profiles')
  .insert({ id, email, full_name, role: 'staff' });

// Ignore duplicate key errors (trigger already created it)
if (profileError && !profileError.message.includes('duplicate key')) {
  // Handle error
}
```

## Best Practices

1. **Always use database triggers** - Don't rely solely on application code
2. **Handle duplicates gracefully** - Use `ON CONFLICT DO NOTHING` or check for duplicate key errors
3. **Keep triggers simple** - Complex logic should be in application code
4. **Log sync operations** - Use `RAISE NOTICE` in triggers for debugging
5. **Test trigger behavior** - Verify triggers fire correctly after deployment

## Troubleshooting Commands

```sql
-- Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check for users without profiles
SELECT u.id, u.email, p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Count sync status
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) as missing_profiles;
```

## Security Notes

- Triggers run with `SECURITY DEFINER` to bypass RLS
- Service role key required for manual sync scripts
- Profile RLS policies ensure users can only see their own data
- Admins can view all profiles via `is_admin()` function

## Testing

```bash
# Run profile sync tests
npm test -- auth.service.test.ts

# Verify trigger behavior
supabase db test
```
