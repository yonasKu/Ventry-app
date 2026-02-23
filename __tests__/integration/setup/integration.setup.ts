/**
 * Integration Test Setup
 * 
 * Global setup for integration tests.
 */

// Mock expo-sqlite for integration tests
// Use a real in-memory database
jest.mock('expo-sqlite', () => {
  const Database = require('better-sqlite3');
  
  return {
    openDatabaseSync: (name: string) => {
      // Use in-memory database for tests
      const db = new Database(':memory:');
      
      return {
        execSync: (sql: string) => db.exec(sql),
        runSync: (sql: string, params?: any[]) => {
          const stmt = db.prepare(sql);
          const result = params ? stmt.run(...params) : stmt.run();
          return { changes: result.changes, lastInsertRowId: result.lastInsertRowId };
        },
        getFirstSync: (sql: string, params?: any[]) => {
          const stmt = db.prepare(sql);
          return params ? stmt.get(...params) : stmt.get();
        },
        getAllSync: (sql: string, params?: any[]) => {
          const stmt = db.prepare(sql);
          return params ? stmt.all(...params) : stmt.all();
        },
        withTransactionSync: (callback: () => void) => {
          db.exec('BEGIN TRANSACTION');
          try {
            callback();
            db.exec('COMMIT');
          } catch (error) {
            db.exec('ROLLBACK');
            throw error;
          }
        },
        closeSync: () => db.close(),
      };
    },
  };
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Suppress console logs in tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
