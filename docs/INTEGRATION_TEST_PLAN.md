# Integration Test Plan

## Overview
Integration tests verify that services work correctly with a real SQLite database, testing actual database operations, transactions, and data persistence.

## Current Status
- **Unit Tests**: 438/452 passing (96.9%) - Use mocked database
- **Integration Tests**: 0 - Need to create

## Goals
1. Test services with real SQLite database
2. Verify data persistence and retrieval
3. Test transaction handling
4. Validate database schema
5. Test concurrent operations
6. Verify data integrity constraints

## Test Structure

### Directory Structure
```
__tests__/
├── unit/              # Current unit tests (with mocks)
│   ├── services/
│   └── utils/
├── integration/       # NEW - Integration tests
│   ├── database/
│   │   ├── DatabaseService.integration.test.ts
│   │   ├── transactions.integration.test.ts
│   │   └── schema.integration.test.ts
│   ├── services/
│   │   ├── EventFlow.integration.test.ts
│   │   ├── AttendeeFlow.integration.test.ts
│   │   ├── CustomFields.integration.test.ts
│   │   ├── Backup.integration.test.ts
│   │   └── Export.integration.test.ts
│   └── setup/
│       ├── integration.setup.ts
│       └── testDatabase.ts
└── e2e/               # FUTURE - End-to-end tests
```

## Integration Test Categories

### 1. Database Operations (Priority: HIGH)

#### DatabaseService.integration.test.ts
```typescript
describe('DatabaseService Integration', () => {
  let db: DatabaseService;
  
  beforeEach(() => {
    // Create fresh test database
    db = new DatabaseService(':memory:'); // In-memory for speed
  });
  
  afterEach(() => {
    db.closeSync();
  });
  
  test('should create and retrieve event', () => {
    const eventId = db.addEvent({
      title: 'Test Event',
      date: '2026-03-01',
      time: '14:00',
      location: 'Test Location'
    });
    
    const event = db.getEventById(eventId);
    expect(event).toBeDefined();
    expect(event.title).toBe('Test Event');
  });
  
  test('should handle concurrent writes', async () => {
    // Test multiple simultaneous writes
  });
  
  test('should maintain referential integrity', () => {
    // Test foreign key constraints
  });
});
```

#### transactions.integration.test.ts
- Test transaction rollback on error
- Test nested transactions
- Test concurrent transaction handling
- Verify ACID properties

#### schema.integration.test.ts
- Verify all tables exist
- Check column types and constraints
- Test indexes
- Validate foreign keys

### 2. Service Workflows (Priority: HIGH)

#### EventFlow.integration.test.ts
```typescript
describe('Event Workflow Integration', () => {
  test('complete event lifecycle', () => {
    // 1. Create event
    const eventId = createEvent();
    
    // 2. Add attendees
    const attendeeIds = addMultipleAttendees(eventId, 10);
    
    // 3. Check in some attendees
    checkInAttendees(attendeeIds.slice(0, 5));
    
    // 4. Get statistics
    const stats = getEventStats(eventId);
    expect(stats.checkedIn).toBe(5);
    expect(stats.totalAttendees).toBe(10);
    
    // 5. Export data
    const exportPath = exportEvent(eventId);
    expect(exportPath).toBeDefined();
    
    // 6. Delete event
    deleteEvent(eventId);
    expect(getEventById(eventId)).toBeNull();
  });
});
```

#### AttendeeFlow.integration.test.ts
- Add attendee with custom fields
- Update attendee information
- Check in/out operations
- Bulk operations
- Search and filter

#### CustomFields.integration.test.ts
- Create field templates
- Add custom fields to events
- Set field values for attendees
- Query by custom field values
- Delete fields and cascade

#### Backup.integration.test.ts
- Create full backup
- Restore from backup
- Verify data integrity after restore
- Handle partial backups
- Test backup versioning

#### Export.integration.test.ts
- Export to CSV with real data
- Export to JSON
- Batch export multiple events
- Verify exported data matches database

### 3. Performance Tests (Priority: MEDIUM)

#### performance.integration.test.ts
```typescript
describe('Performance Integration', () => {
  test('should handle 1000 events efficiently', () => {
    const start = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      db.addEvent({ title: `Event ${i}`, date: '2026-03-01', time: '14:00' });
    }
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
  
  test('should query 10000 attendees quickly', () => {
    // Create event with 10000 attendees
    // Test search performance
  });
});
```

### 4. Data Integrity Tests (Priority: HIGH)

#### dataIntegrity.integration.test.ts
- Test cascade deletes
- Verify unique constraints
- Test data validation
- Check timestamp updates
- Verify counters (attendees_count, checked_in_count)

## Setup Configuration

### integration.setup.ts
```typescript
import { DatabaseService } from '../../services/DatabaseService';

export class TestDatabaseHelper {
  static createTestDatabase(): DatabaseService {
    // Create in-memory database for fast tests
    const db = new DatabaseService(':memory:');
    return db;
  }
  
  static seedDatabase(db: DatabaseService) {
    // Add sample data for testing
    const eventId = db.addEvent({
      title: 'Sample Event',
      date: '2026-03-01',
      time: '14:00',
      location: 'Test Location'
    });
    
    // Add sample attendees
    for (let i = 0; i < 10; i++) {
      db.addAttendee(eventId, {
        name: `Attendee ${i}`,
        email: `attendee${i}@test.com`,
        phone: `+1234567890${i}`
      });
    }
    
    return { eventId };
  }
  
  static cleanupDatabase(db: DatabaseService) {
    db.closeSync();
  }
}
```

### jest.integration.config.js
```javascript
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/integration/setup/integration.setup.ts'],
  testTimeout: 30000, // Longer timeout for integration tests
  maxWorkers: 1, // Run serially to avoid database conflicts
};
```

## Running Integration Tests

### Commands
```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm run test:integration -- DatabaseService

# Run with coverage
npm run test:integration -- --coverage

# Run in watch mode
npm run test:integration -- --watch
```

### package.json scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:integration": "jest --config jest.integration.config.js",
    "test:all": "npm run test:unit && npm run test:integration"
  }
}
```

## Test Data Management

### Fixtures
Create reusable test data:

```typescript
// __tests__/integration/fixtures/events.ts
export const sampleEvents = [
  {
    title: 'Conference 2026',
    date: '2026-06-15',
    time: '09:00',
    location: 'Convention Center',
    expected_attendees: '500'
  },
  {
    title: 'Workshop',
    date: '2026-07-20',
    time: '14:00',
    location: 'Training Room',
    expected_attendees: '30'
  }
];

// __tests__/integration/fixtures/attendees.ts
export const sampleAttendees = [
  { name: 'John Doe', email: 'john@example.com', phone: '+1234567890' },
  { name: 'Jane Smith', email: 'jane@example.com', phone: '+0987654321' }
];
```

## Success Criteria

### Phase 1: Core Database (Week 1)
- [ ] DatabaseService integration tests (20 tests)
- [ ] Transaction tests (10 tests)
- [ ] Schema validation tests (5 tests)
- **Target**: 35 integration tests passing

### Phase 2: Service Workflows (Week 2)
- [ ] Event flow tests (15 tests)
- [ ] Attendee flow tests (15 tests)
- [ ] Custom fields tests (10 tests)
- **Target**: 75 integration tests passing

### Phase 3: Advanced Features (Week 3)
- [ ] Backup/restore tests (10 tests)
- [ ] Export tests (10 tests)
- [ ] Performance tests (5 tests)
- [ ] Data integrity tests (10 tests)
- **Target**: 110 integration tests passing

## Benefits

1. **Confidence**: Verify services work with real database
2. **Bug Detection**: Catch issues mocks can't find
3. **Regression Prevention**: Ensure changes don't break existing functionality
4. **Documentation**: Tests serve as usage examples
5. **Performance Insights**: Identify bottlenecks with real data

## Challenges & Solutions

### Challenge 1: Test Speed
- **Solution**: Use in-memory databases (`:memory:`)
- **Solution**: Run tests in parallel where possible
- **Solution**: Use database snapshots for complex setups

### Challenge 2: Test Isolation
- **Solution**: Create fresh database for each test
- **Solution**: Use transactions and rollback
- **Solution**: Clear data between tests

### Challenge 3: Flaky Tests
- **Solution**: Avoid time-dependent tests
- **Solution**: Use deterministic data
- **Solution**: Proper cleanup in afterEach

## Next Steps

1. **Create directory structure** - Set up integration test folders
2. **Write setup helpers** - TestDatabaseHelper, fixtures
3. **Start with DatabaseService** - Core functionality first
4. **Add service workflows** - Event and attendee flows
5. **Expand coverage** - Add remaining services
6. **CI/CD integration** - Run on every commit

## Maintenance

- Review and update tests when services change
- Add tests for new features
- Monitor test execution time
- Keep fixtures up to date
- Document complex test scenarios
