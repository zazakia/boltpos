# BoltPOS - Modular Architecture Documentation

## Overview

BoltPOS has been refactored to follow a **modular, layered architecture** with clear separation of concerns, making it easy to add new features, maintain code, and scale the application.

## Architecture Principles

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Dependency Inversion**: Components depend on abstractions (services/hooks), not implementations
3. **DRY (Don't Repeat Yourself)**: Common logic is extracted into reusable utilities and services
4. **Type Safety**: Full TypeScript coverage with centralized type definitions
5. **Loose Coupling**: Layers communicate through clean interfaces
6. **High Cohesion**: Related functionality is grouped together

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  (app/ - Screens)                                           │
│  Thin orchestrators that compose components                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                    COMPONENT LAYER                           │
│  (components/ - Reusable UI)                                │
│  Pure presentation components                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                 INTEGRATION LAYER                            │
│  (hooks/ - Custom hooks, contexts/ - Global state)          │
│  Bridges services and components                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                BUSINESS LOGIC LAYER                          │
│  (services/ - Business logic & API abstraction)             │
│  All business rules and data transformations                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                  DATA ACCESS LAYER                           │
│  (lib/supabase.ts - Supabase client)                        │
│  Database connection and configuration                       │
└─────────────────────────────────────────────────────────────┘

        CROSS-CUTTING CONCERNS
┌─────────────────────────────────────────────────────────────┐
│  types/      - TypeScript type definitions                   │
│  utils/      - Utility functions (formatting, validation)   │
│  constants/  - App constants (config, messages, colors)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
boltpos/
├── app/                          # Screens (Expo Router)
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main app screens
│   │   ├── index.tsx            # POS screen
│   │   ├── cart.tsx
│   │   ├── products.tsx
│   │   ├── orders.tsx
│   │   ├── users.tsx
│   │   └── profile.tsx
│   └── _layout.tsx              # Root layout
│
├── components/                   # Reusable UI components (to be created)
│   ├── common/                   # Shared components
│   ├── products/                 # Product-specific components
│   ├── orders/                   # Order-specific components
│   └── users/                    # User-specific components
│
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx          # Authentication state
│   └── CartContext.tsx          # Shopping cart state
│
├── hooks/                        # Custom React hooks
│   ├── useProducts.ts           # Product data hook
│   ├── useCategories.ts         # Category data hook
│   ├── useOrders.ts             # Order data hook
│   ├── useUsers.ts              # User data hook
│   └── useFrameworkReady.ts     # Framework hook
│
├── services/                     # Business logic & API layer
│   └── api/
│       ├── productService.ts    # Product operations
│       ├── categoryService.ts   # Category operations
│       ├── orderService.ts      # Order operations
│       ├── userService.ts       # User operations
│       ├── authService.ts       # Authentication operations
│       └── index.ts
│
├── types/                        # TypeScript definitions
│   ├── models.ts                # Domain models
│   ├── api.ts                   # API types
│   ├── ui.ts                    # UI types
│   └── index.ts
│
├── utils/                        # Utility functions
│   ├── currency.ts              # Currency formatting
│   ├── calculations.ts          # Business calculations
│   ├── validation.ts            # Validation logic
│   ├── errorHandling.ts         # Error utilities
│   ├── formatting.ts            # String/date formatting
│   └── index.ts
│
├── constants/                    # Application constants
│   ├── config.ts                # App configuration
│   ├── messages.ts              # User messages
│   ├── colors.ts                # Color palette
│   └── index.ts
│
├── lib/                          # External services
│   └── supabase.ts              # Supabase client
│
└── assets/                       # Static assets

```

---

## Layer Responsibilities

### 1. Presentation Layer (`app/`)

**Purpose**: Thin orchestrators that compose components and handle navigation

**Responsibilities**:
- Route definitions (Expo Router)
- Component composition
- Navigation handling
- Minimal business logic

**Example**:
```typescript
// app/(tabs)/products.tsx
export default function ProductsScreen() {
  const { products, loading } = useProducts();
  const { categories } = useCategories();

  return <ProductList products={products} categories={categories} />;
}
```

**Key Rule**: Screens should be thin and delegate to hooks/components

---

### 2. Component Layer (`components/`)

**Purpose**: Reusable, pure presentation components

**Responsibilities**:
- UI rendering
- User interaction handling
- Prop validation
- Styling

**Example**:
```typescript
// components/products/ProductCard.tsx
export function ProductCard({ product, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{product.name}</Text>
      <Text>{formatPrice(product.price)}</Text>
    </TouchableOpacity>
  );
}
```

**Key Rule**: Components should NOT directly call APIs or contain business logic

---

### 3. Integration Layer (`hooks/`, `contexts/`)

**Purpose**: Bridge between services and components

**Hooks Responsibilities** (`hooks/`):
- Data fetching orchestration
- Loading/error state management
- Service method exposure
- React lifecycle integration

**Example**:
```typescript
// hooks/useProducts.ts
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await productService.getProducts();
    setProducts(data);
  };

  return { products, loading, refresh: loadProducts };
};
```

**Context Responsibilities** (`contexts/`):
- Global state management
- Cross-component data sharing
- Authentication state
- Cart state

**Key Rule**: Hooks/contexts delegate to services for data operations

---

### 4. Business Logic Layer (`services/`)

**Purpose**: All business logic and API abstraction

**Responsibilities**:
- API calls (Supabase)
- Data transformation
- Business rules enforcement
- Error handling
- Input validation

**Example**:
```typescript
// services/api/productService.ts
export const createProduct = async (data: CreateProductDto): Promise<Product> => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return product;
  } catch (error) {
    logError(error);
    throw new Error(MESSAGES.ERROR.PRODUCT_CREATE_FAILED);
  }
};
```

**Key Rule**: Services are the ONLY layer that directly interacts with Supabase

---

### 5. Data Access Layer (`lib/`)

**Purpose**: Database connection and configuration

**Responsibilities**:
- Supabase client initialization
- Environment variable validation
- Database type definitions

**Example**:
```typescript
// lib/supabase.ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export type Database = {...};
```

**Key Rule**: This layer is configuration-only, no business logic

---

### 6. Cross-Cutting Concerns

#### Types (`types/`)
**Purpose**: Centralized TypeScript definitions

```typescript
// types/models.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  // ...
}
```

#### Utils (`utils/`)
**Purpose**: Reusable utility functions

```typescript
// utils/currency.ts
export const formatCurrency = (amount: number): string => {
  return `${APP_CONFIG.CURRENCY_SYMBOL} ${amount.toFixed(2)}`;
};
```

#### Constants (`constants/`)
**Purpose**: Application-wide constants

```typescript
// constants/config.ts
export const APP_CONFIG = {
  TAX_RATE: 0.1,
  CURRENCY: 'UGX',
};
```

---

## Data Flow

### Reading Data (Top-Down)

```
Screen (products.tsx)
   ↓ calls
Hook (useProducts)
   ↓ calls
Service (productService.getProducts)
   ↓ calls
Supabase Client
   ↓ returns
Service (transforms data)
   ↓ returns
Hook (manages state)
   ↓ returns
Screen (renders components)
```

### Writing Data (Bottom-Up)

```
Component (ProductForm)
   ↓ user action
Screen (products.tsx)
   ↓ calls
Hook (useProducts.createProduct)
   ↓ calls
Service (productService.createProduct)
   ↓ calls
Supabase Client
   ↓ success
Service (returns created product)
   ↓ returns
Hook (updates local state)
   ↓ triggers re-render
Component (shows success)
```

---

## Benefits of This Architecture

### 1. **Easy to Add Features**

To add a new feature (e.g., "Discounts"):

1. Add types in `types/models.ts`
2. Create `services/api/discountService.ts`
3. Create `hooks/useDiscounts.ts`
4. Create components in `components/discounts/`
5. Create screen in `app/(tabs)/discounts.tsx`

Each layer is independent and can be developed/tested separately.

### 2. **Easy to Maintain**

- **Find bugs quickly**: Clear layer boundaries make debugging easier
- **Change implementation**: Can swap Supabase for another DB by only changing services
- **Update UI**: Components are separate from logic
- **Fix business rules**: All logic is in services

### 3. **Easy to Test**

```typescript
// Services can be tested without React
test('createProduct creates a product', async () => {
  const result = await productService.createProduct(mockData);
  expect(result).toBeDefined();
});

// Hooks can be tested with React Testing Library
test('useProducts loads products', () => {
  const { result } = renderHook(() => useProducts());
  expect(result.current.loading).toBe(true);
});
```

### 4. **Type Safety**

- Centralized types prevent duplication
- TypeScript catches errors at compile time
- Auto-completion in IDEs

### 5. **Code Reusability**

- Services reused across multiple hooks
- Hooks reused across multiple screens
- Components reused everywhere
- Utils used throughout the app

---

## Design Patterns Used

### 1. **Repository Pattern** (Services)
Services abstract data access, hiding Supabase implementation details.

### 2. **Custom Hooks Pattern**
React hooks encapsulate stateful logic for reuse.

### 3. **Provider Pattern** (Context)
Context providers share state across component tree.

### 4. **Dependency Injection**
Components receive dependencies via props/hooks, not direct imports.

### 5. **Single Responsibility Principle**
Each module has one reason to change.

---

## Migration Guide

### Old Pattern (Before Refactor)

```typescript
// ❌ Component directly using Supabase
function ProductsScreen() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*');
      setProducts(data);
    };
    loadProducts();
  }, []);

  // 700 lines of mixed logic...
}
```

**Problems**:
- Tight coupling to Supabase
- Business logic mixed with UI
- Hard to test
- Hard to reuse

### New Pattern (After Refactor)

```typescript
// ✅ Component using hook
function ProductsScreen() {
  const { products, loading } = useProducts();

  return <ProductList products={products} loading={loading} />;
}

// Hook
function useProducts() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    productService.getProducts().then(setProducts);
  }, []);
  return { products };
}

// Service
export const getProducts = async () => {
  const { data } = await supabase.from('products').select('*');
  return data;
};
```

**Benefits**:
- Loose coupling
- Separation of concerns
- Easy to test
- Reusable

---

## Best Practices

### 1. **Never Import Supabase in Components/Hooks**

❌ **Bad**:
```typescript
import { supabase } from '@/lib/supabase';

function MyComponent() {
  const { data } = await supabase.from('products').select();
}
```

✅ **Good**:
```typescript
import { useProducts } from '@/hooks/useProducts';

function MyComponent() {
  const { products } = useProducts();
}
```

### 2. **Keep Services Pure**

Services should not depend on React or UI state:

✅ **Good**:
```typescript
export const getProducts = async (): Promise<Product[]> => {
  // Pure function, no React dependencies
};
```

### 3. **Keep Components Thin**

Components should focus on rendering, not business logic:

✅ **Good**:
```typescript
function ProductCard({ product, onDelete }: Props) {
  return (
    <View>
      <Text>{product.name}</Text>
      <Button onPress={() => onDelete(product.id)}>Delete</Button>
    </View>
  );
}
```

### 4. **Use TypeScript Types**

Always import from centralized types:

```typescript
import { Product, Category } from '@/types';
```

### 5. **Handle Errors Consistently**

Use error handling utilities:

```typescript
import { handleApiError, logError } from '@/utils';

try {
  // ...
} catch (error) {
  logError(error);
  throw new Error(handleApiError(error));
}
```

---

## Performance Considerations

1. **Memoization**: Use `useMemo` for expensive calculations
2. **Lazy Loading**: Load data only when needed
3. **Caching**: Services can implement caching
4. **Pagination**: Implemented in services, exposed via hooks

---

## Future Enhancements

1. **Add Tests**: Unit tests for services, integration tests for hooks
2. **Add Caching**: Service-level caching with cache invalidation
3. **Add Offline Support**: Local storage sync
4. **Add Analytics**: Centralized analytics service
5. **Add Error Boundary**: React error boundaries for components
6. **Add Logging**: Enhanced logging service

---

## Summary

BoltPOS now follows a **clean, modular architecture** that:

- ✅ Separates concerns into clear layers
- ✅ Makes adding features easy and predictable
- ✅ Improves code maintainability
- ✅ Enables comprehensive testing
- ✅ Provides type safety throughout
- ✅ Reduces code duplication
- ✅ Improves developer experience

The architecture is **scalable**, **testable**, and follows **modern best practices** for React Native applications.
