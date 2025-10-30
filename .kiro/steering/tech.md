# Technology Stack

## Core Framework

- **React Native 0.81.5** with **Expo 54.0.21**
- **TypeScript** with strict mode enabled
- **Expo Router 6.0.14** for file-based routing
- **React 19.1.0** with React DOM for web support

## Backend & Database

- **Supabase** (Backend-as-a-Service)
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication with session management
  - Database functions for atomic operations

## State Management

- **React Context API** for global state
  - `AuthContext`: User authentication and profile management
  - `CartContext`: Shopping cart with stock validation

## Key Libraries

- `@supabase/supabase-js` - Supabase client
- `expo-router` - File-based navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `lucide-react-native` - Icon library
- `expo-image-picker` - Image uploads for products
- `react-native-url-polyfill` - URL polyfill for Supabase

## Build System

Expo with Metro bundler

## Common Commands

```bash
# Development
npm run dev              # Start Expo development server
npm run android          # Run on Android device/emulator
npm run ios              # Run on iOS device/simulator

# Build
npm run build:web        # Build for web deployment

# Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking
```

## Environment Variables

Required environment variables (prefix with `EXPO_PUBLIC_` for Expo):
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` maps to project root
- Includes Expo types and environment declarations
