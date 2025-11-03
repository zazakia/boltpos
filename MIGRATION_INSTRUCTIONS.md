# Voucher System Migration Instructions

This document provides instructions for applying the voucher receiving system migration to your Supabase database.

## Overview

The voucher system adds the following features:
- **Supplier Management**: Track vendors and suppliers
- **Voucher/Purchase Orders**: Create and manage incoming stock orders
- **Receiving Process**: Update inventory when goods are received
- **Accounts Payable**: Track and manage payments owed to suppliers

## Migration File

The migration file is located at:
```
supabase/migrations/20251103000000_create_voucher_system.sql
```

## How to Apply the Migration

### Method 1: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase Dashboard at https://app.supabase.com
2. Navigate to your project
3. Go to the **SQL Editor** section
4. Click **New Query**
5. Copy the contents of `supabase/migrations/20251103000000_create_voucher_system.sql`
6. Paste into the SQL Editor
7. Click **Run** to execute the migration
8. Verify success by checking the **Table Editor** for the new tables:
   - suppliers
   - vouchers
   - voucher_items
   - accounts_payable

### Method 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're in the project directory
cd /home/user/boltpos

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
supabase db push
```

### Method 3: Manual SQL Execution

If you prefer to run the SQL manually:

1. Connect to your PostgreSQL database using your preferred client (psql, pgAdmin, etc.)
2. Execute the SQL from the migration file:
```bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f supabase/migrations/20251103000000_create_voucher_system.sql
```

## What the Migration Does

### Tables Created

1. **suppliers** - Stores supplier/vendor information
   - name, contact_person, email, phone, address
   - Soft deletion with `active` field

2. **vouchers** - Purchase orders and receiving vouchers
   - voucher_number, supplier_id, user_id, total_amount
   - Status tracking: pending → received/cancelled

3. **voucher_items** - Line items for each voucher
   - product_id, quantity, unit_cost, subtotal

4. **accounts_payable** - Payment tracking
   - amount_due, amount_paid, balance (computed)
   - Status: unpaid → partially_paid → paid

### Functions Created

1. **receive_voucher_items(voucher_id, create_payable)**
   - Processes voucher receipt
   - Updates product stock atomically
   - Creates stock logs
   - Generates accounts payable entry

2. **update_payable_payment(payable_id, payment_amount)**
   - Records payments
   - Updates payment status automatically
   - Validates payment amounts

### Security

- All tables have Row Level Security (RLS) enabled
- Admin-only access for creating/managing vouchers and suppliers
- Authenticated users can view vouchers and suppliers
- Proper foreign key constraints and cascading deletes

## Sample Data

The migration includes sample suppliers:
- ABC Suppliers Inc.
- XYZ Wholesale

You can delete these after testing if needed.

## Verification

After running the migration, verify the following:

1. **Tables exist**:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('suppliers', 'vouchers', 'voucher_items', 'accounts_payable');
   ```

2. **Functions exist**:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name IN ('receive_voucher_items', 'update_payable_payment');
   ```

3. **RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('suppliers', 'vouchers', 'voucher_items', 'accounts_payable');
   ```

## Troubleshooting

### Error: "function is_admin() does not exist"

This migration depends on the `is_admin()` function from the base schema. Make sure all previous migrations have been applied first.

### Error: "relation products does not exist"

The voucher system requires the core POS tables (products, profiles, etc.). Run the base migrations first:
- 20251027000000_create_profiles_table.sql
- 20251027152034_create_pos_schema.sql
- 20251028173500_add_stock_functions.sql

### Permission Errors

Make sure you're connected as a user with sufficient privileges (superuser or database owner).

## Usage

Once the migration is complete, you can:

1. **Add Suppliers**: Use the Suppliers tab in the app
2. **Create Vouchers**: Use the Vouchers tab to create purchase orders
3. **Receive Goods**: Select a pending voucher and click "Receive"
4. **Track Payments**: Use the Payables tab to record supplier payments

## Rollback (if needed)

To rollback this migration, execute:

```sql
-- Drop tables in reverse order (accounting for foreign keys)
DROP TABLE IF EXISTS accounts_payable CASCADE;
DROP TABLE IF EXISTS voucher_items CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS receive_voucher_items(uuid, boolean);
DROP FUNCTION IF EXISTS update_payable_payment(uuid, numeric);
DROP FUNCTION IF EXISTS update_updated_at_column();
```

**Warning**: This will delete all voucher, supplier, and accounts payable data!
