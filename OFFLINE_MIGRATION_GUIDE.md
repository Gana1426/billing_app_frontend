# Offline Mobile Billing App - SQLite Migration Guide

## Overview

Your mobile billing application has been successfully converted from a backend-dependent system (FastAPI + PostgreSQL) to a fully offline mobile app using **SQLite** as the local database.

### Key Changes

**Before:**

- All data stored in PostgreSQL on the server
- API calls to FastAPI backend for every operation
- Required network connectivity

**After:**

- All data stored locally in SQLite on the mobile device
- Direct database operations without network calls
- Works 100% offline

---

## Architecture

### Database Layer (`db/`)

#### SQLite Service (`db/sqlite.ts`)

- **Core SQLite database management**
- Initializes the database on app startup
- Provides methods: `execute()`, `query()`, `queryOne()`, `transaction()`
- Auto-creates tables and indexes on first run

#### Database Schema

The following tables are created automatically:

```
users          - User accounts and authentication
vegetables     - Product catalog
inventory      - Daily pricing and stock levels
bills          - Invoice headers
bill_items     - Line items in each bill
```

#### Repositories (`db/repositories/`)

Each entity has a dedicated repository:

- `userRepository` - User management
- `vegetableRepository` - Product management
- `inventoryRepository` - Pricing and stock
- `billRepository` - Billing operations

### Service Layer (`services/`)

#### Database Service (`services/dbService.ts`)

High-level operations replacing API calls:

- `authDbService` - Login/signup (local authentication)
- `vegetableDbService` - Product catalog
- `inventoryDbService` - Daily pricing management
- `billDbService` - Bill creation and history

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

The app now uses `expo-sqlite` instead of Supabase:

```json
"expo-sqlite": "~14.2.1"
```

### 2. Run the App

```bash
npx expo start
# Then select your platform (Android/iOS/Web)
```

### 3. First Launch

On first launch, the app automatically:

1. ✓ Initializes SQLite database
2. ✓ Creates all required tables
3. ✓ Seeds default data (vegetables, users)
4. ✓ Creates sample inventory records

### 4. Default Login Credentials

```
Username: admin
Password: admin123
Role: admin

Username: shopkeeper
Password: shop123
Role: shopkeeper
```

---

## File Structure

```
db/
├── sqlite.ts                 # SQLite service and initialization
├── client.ts                 # Database client initialization
├── seed.ts                   # Data seeding functions
├── schema/
│   ├── index.ts
│   ├── users.ts             # User interfaces
│   ├── vegetables.ts        # Vegetable interfaces
│   ├── inventory.ts         # Inventory interfaces
│   └── bills.ts             # Bill interfaces
└── repositories/
    ├── userRepository.ts
    ├── vegetableRepository.ts
    ├── inventoryRepository.ts
    └── billRepository.ts

services/
├── dbService.ts             # Main service layer (replaces API)
├── storage.ts               # Local storage (AsyncStorage)
└── api.ts                   # (Deprecated - kept for reference)

utils/
├── syncManager.ts           # Bill saving to local database
├── idGenerator.ts           # Unique ID generation
└── ...

app/
├── _layout.tsx              # Initializes database on startup
├── login.tsx                # Uses local auth
└── shop/
    ├── index.tsx            # Uses dbService instead of API
    └── history.tsx          # Uses dbService for bill history
```

---

## API Migration Examples

### Authentication

**Before:**

```typescript
import { authApi } from "../services/api";
const response = await authApi.login({ username, password });
```

**After:**

```typescript
import { authDbService } from "../services/dbService";
const response = await authDbService.login({ username, password });
```

### Fetching Vegetables

**Before:**

```typescript
import { inventoryApi } from "../services/api";
const res = await inventoryApi.getAll();
```

**After:**

```typescript
import { inventoryDbService } from "../services/dbService";
const res = await inventoryDbService.getAll();
```

### Creating Bills

**Before:**

```typescript
import { billApi } from "../services/api";
await billApi.create(billData);
```

**After:**

```typescript
import { billDbService } from "../services/dbService";
await billDbService.create(billData);
```

### Bill History

**Before:**

```typescript
const response = await billApi.getHistory();
```

**After:**

```typescript
const response = await billDbService.getHistory();
```

---

## Database Operations

### Query Data

```typescript
import { vegetableRepository } from "../db/repositories/vegetableRepository";

// Get all vegetables
const veggies = await vegetableRepository.getAll();

// Get specific vegetable
const tomato = await vegetableRepository.getById(vegetableId);

// Create new vegetable
const newVeg = await vegetableRepository.create({
  name: "Broccoli",
  tamil_name: "ப்ரோக்கோலி",
  category: "Vegetable",
});
```

### Create Bills

```typescript
import { billRepository } from "../db/repositories/billRepository";

const billData = {
  total_amount: 1500,
  discount: 100,
  customer_name: "John Doe",
  items: [
    {
      vegetable_id: "veg-001",
      quantity: 2,
      unit_price: 50,
      total_price: 100,
      unit: "kg",
    },
  ],
};

const bill = await billRepository.createBill(billData);
```

### Transactions

```typescript
import { sqliteService } from "../db/sqlite";

// Multiple operations in a transaction
await sqliteService.transaction(async () => {
  await billRepository.createBill(billData);
  // Other operations...
});
```

---

## Seeding Data

### Seed Database at Startup

Automatically happens in `app/_layout.tsx`:

```typescript
import { initializeDatabase } from "../db/client";
import { seedDatabase } from "../db/seed";

await initializeDatabase();
await seedDatabase();
```

### Manual Seeding

```typescript
import { seedDatabase, resetAndSeedDatabase } from "../db/seed";

// Seed new data
await seedDatabase();

// Reset and reseed
await resetAndSeedDatabase();
```

### Seeding Vegetables

The app seeds vegetables from `constants/Vegetables.ts` (SOUTHERN_VEGETABLES).

To add more vegetables to the seed data, add them to the `DEFAULT_VEGETABLES` in `db/seed.ts`.

---

## Configuration & Customization

### Change Database Location

The SQLite database is stored at:

- **iOS**: `Library/Application Support/billing_app.db`
- **Android**: `data/data/com.app.name/billing_app.db`

The database name is defined in `db/sqlite.ts`:

```typescript
export const DB_NAME = "billing_app.db";
```

### Add New Tables

Edit `db/sqlite.ts` in the `createSchema()` method:

```typescript
private async createSchema(): Promise<void> {
    // Add your new table creation SQL
    await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS new_table (
            id TEXT PRIMARY KEY,
            ... columns ...
        );
    `);
}
```

### Change Authentication Logic

Edit `db/repositories/userRepository.ts` and `services/dbService.ts` to implement:

- Password hashing (bcrypt)
- Token generation
- Custom validation logic

---

## Best Practices

### 1. Always Initialize Database First

```typescript
// In app/_layout.tsx or root component
await initializeDatabase();
```

### 2. Use Repositories for Data Access

❌ Don't query directly with SQL
✅ Do use repository methods

```typescript
// Good
await userRepository.getByUsername("admin");

// Avoid
await sqliteService.query("SELECT * FROM users WHERE username = ?", ["admin"]);
```

### 3. Use Transactions for Related Operations

```typescript
await sqliteService.transaction(async () => {
  await billRepository.createBill(billData);
  // All operations succeed or all fail
});
```

### 4. Handle Errors Gracefully

```typescript
try {
  const bills = await billRepository.getHistory();
} catch (error) {
  console.error("Failed to fetch bills:", error);
  // Provide fallback UI
}
```

### 5. Use Type Safety

```typescript
import { Bill, BillItem } from "../db/schema/bills";

const bill: Bill = {
  id: "bill-001",
  total_amount: 1000,
  discount: 50,
  customer_name: "John",
  created_at: new Date().toISOString(),
};
```

---

## Offline Features

### ✓ Works Without Internet

- All operations are local
- No API calls required
- Instant data access

### ✓ Persistent Storage

- Data survives app restart
- SQLite is stored on device

### ✓ Local Authentication

- Login/logout without network
- Credentials stored locally

### ✓ Bill Management

- Create, view, and download bills offline
- Full billing history available locally

---

## Performance Tips

### 1. Index Optimization

Already included in schema:

- `idx_inventory_vegetable_id` - Fast inventory lookups
- `idx_bill_items_bill_id` - Fast bill line items
- `idx_bills_created_at` - Fast bill history

### 2. Batch Operations

```typescript
// Insert multiple vegetables at once
for (const veg of vegetables) {
  await sqliteService.transaction(async () => {
    await vegetableRepository.create(veg);
  });
}
```

### 3. Pagination

```typescript
// Use LIMIT in queries for large datasets
const bills = await billRepository.getHistory(50); // Last 50 bills
```

---

## Troubleshooting

### Database Not Initializing

```
Error: Database not initialized

Solution: Ensure initializeDatabase() is called before any DB operations
```

### Bills Not Saving

```
Error: Failed to create bill

Solution: Check billData format matches the schema
Ensure vegetable_id exists in database
```

### Stale Data After Updates

```
Solution: Refresh components after updates
Use useEffect or manual refetch
```

### Delete/Reset Database

```typescript
// Reset database and reseed
import { sqliteService } from "../db/sqlite";
await sqliteService.resetDatabase();
```

---

## Migration Checklist

- [x] SQLite database set up
- [x] All repositories refactored to SQLite
- [x] API calls removed from components
- [x] Authentication works locally
- [x] Bills saved to local database
- [x] Bill history retrieval works
- [x] Default data seeded
- [x] Error handling implemented
- [ ] Test on actual devices
- [ ] Set up backup/export functionality (optional)

---

## Future Enhancements

### Optional Improvements

1. **Data Encryption**
   - Encrypt sensitive data before storing in SQLite
   - Use libraries like `expo-sqlite-encryption`

2. **Backup & Restore**
   - Export database to file
   - Import database from file
   - Cloud backup integration (optional)

3. **Advanced Analytics**
   - Generate reports from local data
   - Monthly/yearly summaries
   - Local data analytics

4. **Bi-directional Sync**
   - If backend becomes available, sync data
   - Conflict resolution
   - Incremental updates

5. **Password Security**
   - Implement bcrypt hashing
   - Implement session tokens
   - Add logout on inactivity

---

## Support & Resources

- [Expo SQLite Documentation](https://docs.expo.dev/modules/expo-sqlite/)
- [SQLite Best Practices](https://www.sqlite.org/bestpractice.html)
- [React Native Offline Patterns](https://reactnative.dev/docs/network)

---

## Summary

Your billing app is now fully functional as an offline mobile app using SQLite. All data is stored locally, operations are instant, and the app works without any network connectivity.

**Key Points:**

- ✓ No backend required
- ✓ No internet needed
- ✓ All data persistent
- ✓ Type-safe operations
- ✓ Easy to maintain and extend
