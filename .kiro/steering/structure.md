# Project Structure

## Directory Organization

```
/app                    # Expo Router file-based routing
  /(auth)              # Authentication screens (login, signup)
  /(tabs)              # Main app tabs (POS, cart, products, orders)
  _layout.tsx          # Root layout with providers
  index.tsx            # Entry point/redirect logic

/contexts              # React Context providers
  AuthContext.tsx      # Authentication and user profile state
  CartContext.tsx      # Shopping cart state with stock validation

/lib                   # Core libraries and configurations
  supabase.ts          # Supabase client setup and TypeScript types

/utils                 # Utility functions
  currency.ts          # Currency formatting (Philippine Peso)
  errorHandler.ts      # Error handling utilities

/hooks                 # Custom React hooks
  useFrameworkReady.ts # Framework initialization hook

/assets                # Static assets
  /images              # App icons and images

/supabase              # Database migrations and schema
  /migrations          # SQL migration files

/android               # Android native project
/ios                   # iOS native project (if exists)
```

## Routing Convention

Uses Expo Router file-based routing:
- Folders in parentheses `(auth)`, `(tabs)` are route groups (don't appear in URL)
- `_layout.tsx` files define nested layouts
- `index.tsx` is the default route for a directory
- `+not-found.tsx` handles 404 errors

## Component Patterns

- Screens are located in `/app` directory
- Context providers wrap the app in `app/_layout.tsx`
- Custom hooks follow `use*` naming convention
- Utility functions are pure and exported from `/utils`

## Import Aliases

Use `@/*` path alias for imports from project root:
```typescript
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/currency';
```

## Database Schema Location

Database types are defined in `lib/supabase.ts` as TypeScript interfaces matching the Supabase schema. Migration files are in `/supabase/migrations`.

## Key Files

- `app/_layout.tsx` - Root layout with AuthProvider and CartProvider
- `lib/supabase.ts` - Supabase client and database type definitions
- `contexts/AuthContext.tsx` - Authentication logic and user state
- `contexts/CartContext.tsx` - Cart management with stock validation
- `app.json` - Expo configuration
- `package.json` - Dependencies and scripts
