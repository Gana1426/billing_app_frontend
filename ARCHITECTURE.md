# Offline Billing App Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────┐
│      React Native Mobile App            │
│  (iOS/Android/Web - Expo)               │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │   UI Layer      │
        │  - Components   │
        │  - Screens      │
        └────────┬────────┘
                 │
        ┌────────▼────────────────┐
        │  Services Layer         │
        │  - dbService.ts         │
        │  - authDbService        │
        │  - billDbService        │
        │  - inventoryDbService   │
        └────────┬────────────────┘
                 │
        ┌────────▼────────────────┐
        │  Repository Layer       │
        │  - userRepository       │
        │  - billRepository       │
        │  - inventoryRepository  │
        │  - vegetableRepository  │
        └────────┬────────────────┘
                 │
        ┌────────▼────────────────┐
        │  SQLite Database Layer  │
        │  - sqlite.ts            │
        │  Schema:                │
        │  - users                │
        │  - vegetables           │
        │  - inventory            │
        │  - bills                │
        │  - bill_items           │
        └─────────────────────────┘
                 │
        ┌────────▼────────────────┐
        │  Device Storage         │
        │  - SQLite Database File │
        │  - AsyncStorage         │
        │  - File System          │
        └─────────────────────────┘
```

## Component Interactions

### Data Flow

```
User Action (e.g., Login)
    ↓
Component (login.tsx)
    ↓
Service Layer (authDbService.login())
    ↓
Repository (userRepository.getByUsername())
    ↓
SQLite Service (sqliteService.queryOne())
    ↓
Device SQLite Database
    ↓
Result returned up the chain
    ↓
Component state updated
    ↓
UI rerendered
```

## Module Responsibilities

### UI Layer (`app/`)

**Components:**

- `login.tsx` - User authentication
- `shop/index.tsx` - Billing interface
- `shop/history.tsx` - Bill history
- `admin/index.tsx` - Admin panel

**Responsibilities:**

- Handle user interactions
- Manage component state
- Call service layer methods
- Display data and errors

### Service Layer (`services/`)

**Main File:** `dbService.ts`

**Modules:**

- `authDbService` - Authentication operations
- `vegetableDbService` - Product management
- `inventoryDbService` - Pricing and stock
- `billDbService` - Billing operations

**Responsibilities:**

- Abstract complex repository operations
- Provide simple API for UI components
- Handle data transformation
- Manage business logic

### Repository Layer (`db/repositories/`)

**Files:**

- `userRepository.ts` - User CRUD operations
- `vegetableRepository.ts` - Vegetable CRUD operations
- `inventoryRepository.ts` - Inventory CRUD operations
- `billRepository.ts` - Bill CRUD operations with transaction support

**Responsibilities:**

- Direct database queries (CRUD)
- Data validation
- Business rule enforcement
- Query optimization

### Database Layer (`db/`)

**Core Files:**

- `sqlite.ts` - SQLite service
- `client.ts` - Database initialization
- `seed.ts` - Data seeding

**Schema Files:** `schema/*.ts`

- Types and interfaces for all entities

**Responsibilities:**

- SQLite connection management
- Schema creation and migration
- Query execution
- Transaction management
- Error handling

### Utility Layer (`utils/`)

**Files:**

- `syncManager.ts` - Bill persistence
- `idGenerator.ts` - Unique ID generation
- `pdfGenerator.ts` - PDF creation
- `imageHelper.ts` - Image management
- `responsive.ts` - UI scaling

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'shopkeeper')) DEFAULT 'shopkeeper',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Vegetables Table

```sql
CREATE TABLE vegetables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tamil_name TEXT,
    image_url TEXT,
    category TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Inventory Table

```sql
CREATE TABLE inventory (
    id TEXT PRIMARY KEY,
    vegetable_id TEXT NOT NULL,
    price REAL NOT NULL,
    stock_quantity REAL NOT NULL,
    unit TEXT CHECK(unit IN ('kg', 'piece', 'bundle')) DEFAULT 'kg',
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vegetable_id) REFERENCES vegetables(id) ON DELETE CASCADE
);
```

### Bills Table

```sql
CREATE TABLE bills (
    id TEXT PRIMARY KEY,
    total_amount REAL NOT NULL,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    customer_name TEXT,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Bill Items Table

```sql
CREATE TABLE bill_items (
    id TEXT PRIMARY KEY,
    bill_id TEXT NOT NULL,
    vegetable_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    unit TEXT DEFAULT 'kg',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (vegetable_id) REFERENCES vegetables(id) ON DELETE CASCADE
);
```

### Indexes

- `idx_inventory_vegetable_id` - Fast inventory lookups by vegetable
- `idx_inventory_date` - Fast date-based queries
- `idx_bill_items_bill_id` - Fast bill items retrieval
- `idx_bill_items_vegetable_id` - Fast vegetable-based queries
- `idx_bills_created_at` - Fast chronological queries

## Data Flow Examples

### Example 1: User Login

```typescript
// 1. User enters credentials in login.tsx
const handleLogin = async () => {
  // 2. Call service layer
  const result = await authDbService.login({ username, password });

  // 3. Service calls repository
  // -- authDbService.login() calls userRepository.getByUsername()

  // 4. Repository queries database
  // -- userRepository.getByUsername() calls sqliteService.queryOne()

  // 5. SQLite executes query
  // -- SELECT * FROM users WHERE username = ?

  // 6. Result returned to component
  // 7. Update auth context and navigate
  await login(user, token);
};
```

### Example 2: Creating a Bill

```typescript
// 1. User clicks finalize bill in shop/index.tsx
const finalizeBill = async () => {
    const billData = { items: [...], grandTotal: 1000 };

    // 2. SyncManager queues the bill
    await SyncManager.queueBill(billData);

    // 3. SyncManager calls billDbService
    // -- SyncManager.queueBill() transforms data
    // -- Calls billDbService.create()

    // 4. Service calls repository
    // -- billDbService.create() calls billRepository.createBill()

    // 5. Repository executes transaction
    // -- INSERT into bills table
    // -- For each item: INSERT into bill_items table

    // 6. SQLite saves data
    // 7. Bill stored permanently on device
};
```

### Example 3: Fetching Bill History

```typescript
// 1. User navigates to history in shop/history.tsx
useEffect(() => {
  fetchHistory();
}, []);

const fetchHistory = async () => {
  // 2. Call service layer
  const response = await billDbService.getHistory();

  // 3. Service calls repository
  // -- billDbService.getHistory() calls billRepository.getHistory()

  // 4. Repository queries database
  // -- SELECT * FROM bills ORDER BY created_at DESC LIMIT 50

  // 5. Results returned and displayed
  setHistory(response.data);
};
```

## State Management

### Authentication State

```typescript
// AuthContext - Global auth state
- user: User | null
- login(): Saves user to context and AsyncStorage
- logout(): Clears user and storage
- isLoading: Boolean for loading states
```

### Theme State

```typescript
// ThemeContext - UI theme
- theme: 'light' | 'dark'
- isDark: boolean
- language: 'English' | 'Tamil'
```

### Local Component State

```typescript
// Component states managed with useState
- allVegetables: []
- cart: []
- selectedCategory: string
- modalVisible: boolean
```

## Error Handling Strategy

### SQLite Errors

```typescript
try {
  await sqliteService.query(sql, args);
} catch (error) {
  console.error("SQL Error:", error);
  // Fallback to cache or default values
}
```

### Data Validation

```typescript
// Repository level validation
if (!vegetable.name) {
  throw new Error("Vegetable name is required");
}
```

### User-Facing Errors

```typescript
// UI components show alerts
Alert.alert("Error", "Failed to create bill");
```

## Performance Optimization

### Query Optimization

- Indexes on frequently queried columns
- Use LIMIT for large datasets
- Avoid N+1 queries with proper joins

### Caching Strategy

- AsyncStorage for user session data
- In-memory caching for UI state
- SQLite for persistent storage

### Transaction Handling

- Group related operations
- Automatic rollback on failure
- Ensures data consistency

## Security Considerations

### Current Implementation

- Local authentication (username/password)
- No API endpoints
- Data stored locally only
- No encryption (can be added)

### Recommendations

1. Implement password hashing (bcrypt)
2. Add session token expiration
3. Encrypt sensitive data
4. Rate limiting on login attempts
5. Add data export functionality with permission

## Testing Strategy

### Unit Tests

- Repository methods
- Service methods
- Utility functions

### Integration Tests

- Database operations
- Complete workflows (login → bill creation)
- Data persistence

### Manual Testing

- Test on multiple devices
- Test offline scenarios
- Test with large datasets
- Test concurrent operations

## Deployment Checklist

- [ ] Run `npm install` to get fresh dependencies
- [ ] Test on Android device/emulator
- [ ] Test on iOS device/emulator
- [ ] Test offline scenarios
- [ ] Verify bill saving and history
- [ ] Test login credentials
- [ ] Check PDF generation
- [ ] Validate data persistence

## Future Architecture Enhancements

### Phase 2: Enhanced Features

- Data encryption at rest
- Backup and restore functionality
- Advanced analytics
- Report generation

### Phase 3: Optional Sync

- Wi-Fi sync to cloud (optional)
- Conflict resolution
- Incremental updates
- Data merge strategies

### Phase 4: Scale

- Multi-user support on single device
- Advanced permissions
- Audit logging
- Data export formats
