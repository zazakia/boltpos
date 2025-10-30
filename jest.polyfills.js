// Polyfill for Expo's winter runtime in Jest
global.__ExpoImportMetaRegistry = {
  getImportable: jest.fn(),
  loadImportable: jest.fn(),
};

// Polyfill structuredClone if not available
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock global.window if needed
if (typeof window === 'undefined') {
  global.window = {};
}
