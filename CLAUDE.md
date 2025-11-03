# Bolt POS - Claude AI Guide

This document provides essential information for Claude AI instances working on the Bolt POS (Point of Sale) system.

## Project Overview

Bolt POS is a React Native mobile application built with Expo that serves as a point-of-sale system. It features a modern UI with role-based access control, real-time inventory management, and order processing capabilities.

## Technology Stack

### Core Technologies
- **React Native 0.81.5** - Mobile app framework
- **Expo 54.0.21** - Development platform and tools
- **TypeScript** - Static type checking
- **Expo Router** - File-based routing system

### State Management & Context
- **React Context API** - Global state management
  - AuthContext - User authentication and profiles
  - CartContext - Shopping cart functionality with stock validation

### Database & Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row Level Security (RLS)

### Key Dependencies
```json
{
  "expo": "^54.0.21",
  "react": "^19.1.0",
  "@supabase/supabase-js": "^2.58.0",
  "expo-router": "^6.0.14",
  "@react-navigation/bottom-tabs": "^7.2.0"
}
```

## Database Schema

### Core Tables

#### profiles
- Linked to auth.users table
- Fields: id, email, full_name, role, active, created_at, updated_at
- Roles: admin | staff
- Active field for soft deletion

#### categories
- Product categorization with UI colors
- Fields: id, name, color, created_at
- Default categories: Food, Drinks, Snacks, Electronics, Accessories

#### products
- Inventory items with pricing
- Fields: id, name, price, category_id, image_url, stock, active
- Stock management with real-time validation
- Foreign key to categories

#### orders
- Customer orders with totals and payment info
- Fields: id, user_id, total, tax, status, payment_method, created_at
- Status: completed | refunded | cancelled
- Payment methods: cash | card | mobile

#### order_items
- Line items for each order
- Fields: id, order_id, product_id, quantity, price, subtotal

#### stock_logs
- Audit trail for stock changes
- Fields: id, product_id, quantity_change, remaining_stock, created_at

#### suppliers
- Supplier/vendor information management
- Fields: id, name, contact_person, email, phone, address, active, created_at, updated_at
- Soft deletion with active field

#### vouchers
- Purchase orders and receiving vouchers from suppliers
- Fields: id, voucher_number, supplier_id, user_id, total_amount, status, received_date, notes, created_at, updated_at
- Status: pending | received | cancelled
- Links to suppliers and users (who created/received)

#### voucher_items
- Line items for each voucher
- Fields: id, voucher_id, product_id, quantity, unit_cost, subtotal, created_at
- Links to vouchers and products

#### accounts_payable
- Tracks outstanding payments owed to suppliers
- Fields: id, supplier_id, voucher_id, amount_due, amount_paid, balance (computed), payment_date, status, notes, created_at, updated_at
- Status: unpaid | partially_paid | paid
- Balance is automatically calculated as (amount_due - amount_paid)

### Database Functions

#### Stock Management
- decrement_product_stock() - Single product stock decrement
- increment_product_stock() - Single product stock increment
- decrement_multiple_product_stock() - Batch stock decrement (atomic)

#### Voucher Management
- receive_voucher_items() - Processes voucher receipt, updates product stock atomically, creates accounts payable entry
- update_payable_payment() - Records payment against accounts payable and updates status automatically

#### Security
- is_admin() - Admin role checking function

### Security & Access Control

#### Row Level Security (RLS)
- All tables have RLS enabled
- Users can view/edit their own data
- Admins can manage all data
- Profile data is protected based on ownership

#### Auth Context Features
- User authentication with Supabase Auth
- Profile management with role-based access
- Admin user creation (admin@boltpos.com / Admin123!)
- Session management with persistent storage

#### Cart Context Features
- Real-time cart management
- Stock availability validation
- Quantity limits based on available stock
- Cart persistence during session

## Key Components

### 1. AuthContext (contexts/AuthContext.tsx)
- Manages user authentication state
- Handles profile loading and role checking
- Provides useAuth() hook
- Includes admin user creation utility

### 2. CartContext (contexts/CartContext.tsx)
- Global shopping cart state
- Stock validation before adding items
- Quantity management with stock enforcement
- Cart totals calculation
- Provides useCart() hook

### 3. POS Screen (app/(tabs)/index.tsx)
- Main point-of-sale interface
- Product grid with category filtering
- Real-time stock display
- Cart summary and checkout flow
- Low stock warnings

### 4. Cart Screen (app/(tabs)/cart.tsx)
- Cart review with item management
- Stock validation with warnings
- Checkout process with payment options
- Order creation and stock updates
- Tax calculation (10%)

### 5. Products Screen (app/(tabs)/products.tsx)
- Admin-only product and category management
- CRUD operations for products
- Category management with color coding
- Stock management features

### 6. Orders Screen (app/(tabs)/orders.tsx)
- Order history with detailed views
- Status management (admin only)
- User order filtering
- Payment method display

### 7. Vouchers Screen (app/(tabs)/vouchers.tsx)
- Voucher/purchase order management
- Create vouchers with multiple line items
- Receive vouchers to update stock
- Auto-generate voucher numbers
- Status tracking (pending, received, cancelled)
- Admin-only voucher creation and receiving

### 8. Suppliers Screen (app/(tabs)/suppliers.tsx)
- Supplier/vendor management
- CRUD operations for suppliers
- Contact information tracking
- Active/inactive supplier status
- Admin-only supplier management

### 9. Accounts Payable Screen (app/(tabs)/payables.tsx)
- Track outstanding payments to suppliers
- Record payments against payables
- Filter by payment status
- View payment history
- Summary of total outstanding balance
- Admin-only payment recording

## Development Workflow

### Setup & Configuration
1. Install dependencies: npm install
2. Configure environment: Copy .env with Supabase credentials
3. Database setup: Run migrations in Supabase dashboard
4. Start development: npm run dev

### Available Scripts
```bash
npm run dev          # Start development server
npm run android       # Build for Android
npm run ios          # Build for iOS
npm run build:web    # Build for web
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

### Environment Variables
- EXPO_PUBLIC_SUPABASE_URL - Supabase project URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key

## Architecture Patterns

### 1. Context-Based State Management
- Global state using React Context
- Custom hooks for context access
- Separation of concerns for auth and cart

### 2. File-Based Routing (Expo Router)
- Organized by feature/section
- Authentication routes in (auth) folder
- Main app in (tabs) folder
- Protected routes with auth checks

### 3. Role-Based Access Control
- Admin vs Staff roles
- UI elements conditionally rendered based on user role
- Database RLS for data protection

### 4. Real-Time Stock Management
- Atomic stock operations using database functions
- Stock validation at cart and checkout
- Audit logging for inventory changes

## Important Implementation Details

### Stock Management
- Uses database functions for atomic stock updates
- Prevents overselling with real-time validation
- Batch operations for order processing
- Stock logs for audit purposes

### Voucher Receiving Workflow
- Create voucher with supplier and line items
- System generates unique voucher number
- Voucher starts in "pending" status
- Admin receives voucher (atomic operation):
  * Updates product stock quantities
  * Logs stock changes in stock_logs
  * Creates accounts payable entry
  * Updates voucher status to "received"
- Accounts payable tracks payment status
- Partial and full payments supported

### Payment Processing
- Multiple payment methods supported
- Simple checkout flow with payment selection
- Order status tracking
- Tax calculation (fixed 10%)

### UI/UX Patterns
- Modern, clean design with consistent styling
- Loading states for async operations
- Error handling with user-friendly alerts
- Responsive layouts with React Native Flexbox

### Data Validation
- Form validation with TypeScript types
- Stock availability checks before operations
- Error handling for database operations
- User confirmation for destructive actions

## Future Considerations

### Current Limitations
- No payment gateway integration (UI only)
- Limited inventory management features
- No reporting/analytics dashboard
- No barcode/QR code scanning
- No customer management beyond profiles

### Potential Enhancements
- Add payment gateway integration
- Implement inventory alerts
- Add reporting and analytics
- Include barcode scanning
- Customer loyalty program
- Multi-location support

## Debugging Tips

### Common Issues
1. Auth problems: Check Supabase connection and session state
2. Cart sync issues: Verify stock validation logic
3. Database errors: Review RLS policies and permissions
4. Type errors: Ensure proper TypeScript typing in Supabase calls

### Development Tools
- Expo Go app for mobile testing
- Supabase dashboard for database inspection
- React Native Debugger for performance analysis
- Chrome DevTools for web debugging

## Security Notes

- All database operations use Row Level Security
- Admin operations require proper authorization
- User passwords are handled by Supabase Auth
- API keys are stored in environment variables
- Input validation is performed client and server-side

This guide should help future Claude instances quickly understand the codebase structure and implement features effectively.
