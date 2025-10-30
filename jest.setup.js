// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useSegments: jest.fn(),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock Supabase client
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      single: jest.fn(),
    })),
  },
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
