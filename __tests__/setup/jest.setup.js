// Extend Jest matchers from @testing-library/react-native
// Note: extend-expect is included automatically in newer versions

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-sqlite with a shared database instance
const mockDb = {
  execSync: jest.fn(),
  runSync: jest.fn().mockReturnValue({ changes: 1, lastInsertRowId: 1 }),
  getFirstSync: jest.fn().mockReturnValue(null),
  getAllSync: jest.fn().mockReturnValue([]),
  withTransactionSync: jest.fn((callback) => callback()),
  closeSync: jest.fn(),
};

// Export mockDb so tests can access it
global.mockDb = mockDb;

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => global.mockDb),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('{}')),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1024 })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  Paths: {
    document: '/mock/documents',
    cache: '/mock/cache',
  },
  File: jest.fn().mockImplementation((pathOrDir, filename) => {
    const fullPath = filename ? `${pathOrDir}/${filename}` : pathOrDir;
    const mockBackupData = JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      device: 'test-device',
      metadata: {
        events_count: 0,
        attendees_count: 0,
      },
      data: {
        events: [],
        attendees: [],
        custom_fields: [],
        field_templates: [],
        custom_field_values: [],
      },
    });
    return {
      uri: fullPath,
      exists: true,
      write: jest.fn().mockResolvedValue(undefined),
      text: jest.fn().mockResolvedValue(mockBackupData),
      delete: jest.fn().mockResolvedValue(undefined),
      copy: jest.fn().mockResolvedValue(undefined),
      modificationTime: Date.now(),
    };
  }),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({ 
    type: 'success', 
    uri: 'file://mock/backup.json',
    name: 'backup.json'
  })),
}));

// Mock expo-print
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file://mock/report.pdf' })),
}));

// Mock react-native-qrcode-svg
jest.mock('react-native-qrcode-svg', () => 'QRCode');

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Silence console warnings in tests (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up global test timeout
jest.setTimeout(10000);
