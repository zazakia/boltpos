# Unit of Measure (UOM) Implementation

This document explains the multiple unit of measure feature implemented in the BoltPOS system.

## Overview

The UOM feature allows products to be measured and transacted in different units while maintaining a consistent base unit for inventory tracking. For example, rice can be sold in kilos (base unit), sacks (50 kilos), or bags (25 kilos).

## Database Schema

### Products Table Updates

Added to existing `products` table:
- `base_uom` (TEXT): The primary unit of measure (default: 'piece')
- `uom_list` (JSONB): Array of unit objects with conversion rates

Example `uom_list` structure:
```json
[
  {
    "name": "kilo",
    "conversion_to_base": 1,
    "is_base": true
  },
  {
    "name": "sack",
    "conversion_to_base": 50,
    "is_base": false
  },
  {
    "name": "bag",
    "conversion_to_base": 25,
    "is_base": false
  }
]
```

### Transaction Tables with UOM Support

All transaction line item tables now include:
- `uom` (TEXT): Unit of measure used in the transaction
- `conversion_to_base` (NUMERIC): Conversion rate at time of transaction
- `base_quantity` (NUMERIC): Quantity converted to base UOM

Affected tables:
1. `order_items` - Sales transactions
2. `receiving_voucher_items` - Receiving from suppliers
3. `inventory_adjustment_items` - Inventory adjustments
4. `transfer_items` - Branch transfers
5. `customer_return_items` - Customer returns
6. `supplier_return_items` - Supplier returns

### New Tables Created

#### 1. suppliers
Master data for vendors/suppliers:
- `id`, `name`, `contact_person`, `phone`, `email`, `address`
- `active` (boolean)

#### 2. branches
Master data for locations/warehouses:
- `id`, `code`, `name`, `address`, `phone`
- `active` (boolean)
- Default 'MAIN' branch created

#### 3. receiving_vouchers
Records incoming inventory from suppliers:
- `reference_number`, `supplier_id`, `user_id`
- `total_amount`, `remarks`, `status`
- `received_date`

#### 4. inventory_adjustments
Records inventory corrections (in/out):
- `reference_number`, `user_id`, `adjustment_type` (in/out)
- `reason`, `remarks`, `status`
- `adjustment_date`

#### 5. transfers
Records inventory transfers between branches:
- `reference_number`, `from_branch_id`, `to_branch_id`, `user_id`
- `status` (pending/in_transit/received/cancelled)
- `transfer_date`, `received_date`

#### 6. customer_returns
Records items returned by customers:
- `reference_number`, `order_id`, `user_id`
- `total_amount`, `reason`, `remarks`, `status`
- `return_date`

#### 7. supplier_returns
Records items returned to suppliers:
- `reference_number`, `receiving_voucher_id`, `supplier_id`, `user_id`
- `total_amount`, `reason`, `remarks`, `status`
- `return_date`

## TypeScript Types

### UnitOfMeasure Type
```typescript
export type UnitOfMeasure = {
  name: string;
  conversion_to_base: number;
  is_base: boolean;
};
```

### Updated Product Type
```typescript
type Product = {
  // ... existing fields
  base_uom: string;
  uom_list: UnitOfMeasure[];
};
```

## Utility Functions

Located in `/utils/uom.ts`:

### Core Conversion Functions
- `convertToBaseUOM(quantity, uom, uomList)` - Convert to base unit
- `convertFromBaseUOM(baseQuantity, targetUom, uomList)` - Convert from base unit
- `convertBetweenUOMs(quantity, fromUom, toUom, uomList)` - Convert between any two units
- `getConversionRate(uom, uomList)` - Get conversion rate for a UOM
- `getBaseUOM(uomList)` - Get the base UOM object

### Management Functions
- `createDefaultUOMList(baseUomName)` - Create a single-unit UOM list
- `addUOMToList(uomList, name, conversionToBase)` - Add new UOM
- `removeUOMFromList(uomList, name)` - Remove UOM (except base)
- `updateUOMInList(uomList, name, conversionToBase)` - Update conversion rate

### Validation & Display
- `isValidUOM(uom, uomList)` - Check if UOM exists
- `formatUOMDisplay(uom, uomList)` - Format for display (e.g., "sack (50 kilos)")
- `calculateTotalBaseQuantity(items, uomList)` - Sum quantities in base UOM

## React Components

### UOMManager Component
Located in `/components/UOMManager.tsx`

Used in product forms to manage multiple units of measure.

**Props:**
- `baseUom`: Current base unit name
- `uomList`: Array of unit definitions
- `onChange`: Callback when UOM list changes
- `disabled`: Disable editing

**Features:**
- Display base UOM prominently
- List all additional UOMs with conversion rates
- Add new UOM with name and conversion rate
- Edit existing UOM conversion rates
- Delete non-base UOMs
- Inline editing with save/cancel actions

### UOMSelector Component
Located in `/components/UOMSelector.tsx`

Used in transaction forms to select which UOM to use.

**Props:**
- `uomList`: Available units
- `selectedUOM`: Currently selected unit
- `onSelect`: Callback when selection changes
- `disabled`: Disable selection

**Features:**
- Display all available UOMs as selectable buttons
- Show conversion rates for non-base units
- Highlight base unit with badge
- Collapse to simple text if only one UOM available

## Integration Guide

### Adding UOM to Transaction Forms

1. **Import Required Items:**
```typescript
import { UnitOfMeasure } from '@/lib/supabase';
import UOMSelector from '@/components/UOMSelector';
import { convertToBaseUOM } from '@/utils/uom';
```

2. **Add UOM State:**
```typescript
const [selectedUOM, setSelectedUOM] = useState(product.base_uom);
```

3. **Add UOM Selector to Form:**
```tsx
<UOMSelector
  uomList={product.uom_list}
  selectedUOM={selectedUOM}
  onSelect={setSelectedUOM}
/>
```

4. **Calculate Base Quantity on Save:**
```typescript
const baseQuantity = convertToBaseUOM(quantity, selectedUOM, product.uom_list);
const conversionRate = getConversionRate(selectedUOM, product.uom_list);

// Save to database
await supabase.from('order_items').insert({
  product_id: product.id,
  quantity: quantity,
  uom: selectedUOM,
  conversion_to_base: conversionRate,
  base_quantity: baseQuantity,
  // ... other fields
});
```

## Example Usage Scenarios

### Scenario 1: Selling Rice
**Product Setup:**
- Base UOM: kilo
- Additional UOMs:
  - sack (50 kilos)
  - bag (25 kilos)

**Transaction:**
- Customer buys 2 sacks
- Staff selects "sack" UOM
- System records:
  - quantity: 2
  - uom: "sack"
  - conversion_to_base: 50
  - base_quantity: 100 (kilos)

### Scenario 2: Receiving Drinks
**Product Setup:**
- Base UOM: bottle
- Additional UOMs:
  - case (24 bottles)
  - pack (6 bottles)

**Transaction:**
- Received 5 cases from supplier
- Staff selects "case" UOM
- System records:
  - quantity: 5
  - uom: "case"
  - conversion_to_base: 24
  - base_quantity: 120 (bottles)

## Migration Instructions

To apply the database changes:

1. **Ensure Supabase CLI is configured**
2. **Run the migration:**
```bash
supabase db push
```

Or manually apply the migration file:
```bash
psql -h <host> -U <user> -d <database> -f supabase/migrations/20251030000001_add_uom_and_transactions.sql
```

## Important Notes

1. **Base UOM Cannot Be Changed:** Once set, the base UOM name can only be changed by updating all UOMs. The base unit always has a conversion rate of 1.

2. **Inventory Tracking:** All inventory quantities are stored in the base UOM for consistency. Transactions can use any UOM, but they're converted to base for inventory calculations.

3. **Audit Trail:** Transaction line items store both the original UOM/quantity AND the converted base_quantity plus the conversion_rate used. This creates an audit trail if UOM definitions change later.

4. **Backward Compatibility:** Existing products without UOM data will default to "piece" as the base UOM.

5. **RLS Policies:** Row Level Security policies have been created for all new tables to ensure proper access control based on user roles.

## Transaction Modules (To Be Implemented)

The following transaction modules are planned but not yet implemented:

1. **Receiving Voucher Module** - For recording incoming inventory from suppliers
2. **Inventory Adjustment Module** - For corrections, damages, etc.
3. **Transfer Module** - For moving inventory between branches
4. **Customer Return Module** - For processing customer returns
5. **Supplier Return Module** - For returning items to suppliers

Each module will integrate UOM selection using the `UOMSelector` component and will automatically convert quantities to base UOM for inventory tracking.

## Future Enhancements

Potential improvements for consideration:

1. **UOM Groups:** Categorize UOMs (weight, volume, count)
2. **Multi-dimensional UOMs:** Length x Width x Height for construction materials
3. **Batch/Lot Tracking:** Track specific batches with UOM
4. **UOM Price Lists:** Different prices for different UOMs
5. **Auto-conversion Suggestions:** Suggest best UOM based on quantity
6. **UOM Templates:** Predefined UOM sets for common product types

## Support

For questions or issues related to UOM implementation, please refer to:
- Migration file: `supabase/migrations/20251030000001_add_uom_and_transactions.sql`
- TypeScript types: `lib/supabase.ts`
- Utility functions: `utils/uom.ts`
- UI components: `components/UOMManager.tsx`, `components/UOMSelector.tsx`
