# Database Customization Guide

## Overview

This guide explains how to customize the SQLite database schema, add new entities, and extend functionality for your offline billing app.

---

## Customizing Existing Tables

### Adding a New Column to Users

**Step 1:** Update the schema in `db/sqlite.ts`

```typescript
// Current:
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'shopkeeper')) DEFAULT 'shopkeeper',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

// Updated (add phone number):
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'shopkeeper')) DEFAULT 'shopkeeper',
    phone TEXT,  // NEW
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Step 2:** Update the TypeScript interface in `db/schema/users.ts`

```typescript
// Current:
export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: "admin" | "shopkeeper";
  created_at: string;
}

// Updated:
export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: "admin" | "shopkeeper";
  phone?: string; // NEW
  created_at: string;
}
```

**Step 3:** Update repository methods in `db/repositories/userRepository.ts`

```typescript
async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const id = generateId();
    const createdAt = new Date().toISOString();

    await sqliteService.execute(
        `INSERT INTO users (id, username, password_hash, role, phone, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, user.username, user.password_hash, user.role, user.phone, createdAt]
    );

    return { id, username: user.username, password_hash: user.password_hash,
             role: user.role, phone: user.phone, created_at: createdAt };
}
```

---

## Adding a New Table

### Example: Add Customer Table

**Step 1:** Create schema interface in `db/schema/customers.ts`

```typescript
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_purchases: number;
  preferred_items?: string; // JSON array
  created_at: string;
}
```

**Step 2:** Add table creation in `db/sqlite.ts`

```typescript
private async createSchema(): Promise<void> {
    // ... existing tables ...

    // Add new customers table
    await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT UNIQUE,
            address TEXT,
            total_purchases REAL DEFAULT 0,
            preferred_items TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Add index for emails
    await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    `);
}
```

**Step 3:** Create repository in `db/repositories/customerRepository.ts`

```typescript
import { sqliteService } from "../sqlite";
import { Customer } from "../schema/customers";
import { generateId } from "../../utils/idGenerator";

export const customerRepository = {
  async create(
    customer: Omit<Customer, "id" | "created_at">,
  ): Promise<Customer> {
    try {
      const id = generateId();
      const createdAt = new Date().toISOString();

      await sqliteService.execute(
        `INSERT INTO customers (id, name, phone, email, address, total_purchases, preferred_items, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          customer.name,
          customer.phone,
          customer.email,
          customer.address,
          customer.total_purchases,
          customer.preferred_items,
          createdAt,
        ],
      );

      return {
        id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        total_purchases: customer.total_purchases,
        preferred_items: customer.preferred_items,
        created_at: createdAt,
      };
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  },

  async getByEmail(email: string): Promise<Customer | null> {
    try {
      return await sqliteService.queryOne<Customer>(
        `SELECT * FROM customers WHERE email = ?`,
        [email],
      );
    } catch (error) {
      console.error("Error fetching customer:", error);
      throw error;
    }
  },

  async getAll(): Promise<Customer[]> {
    try {
      return await sqliteService.query<Customer>(
        `SELECT * FROM customers ORDER BY created_at DESC`,
      );
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },

  async update(
    id: string,
    customer: Partial<Customer>,
  ): Promise<Customer | null> {
    try {
      const updateFields = Object.keys(customer)
        .filter(
          (key) =>
            customer[key as keyof Customer] !== undefined &&
            key !== "id" &&
            key !== "created_at",
        )
        .map((key) => `${key} = ?`)
        .join(", ");

      const updateValues = Object.keys(customer)
        .filter(
          (key) =>
            customer[key as keyof Customer] !== undefined &&
            key !== "id" &&
            key !== "created_at",
        )
        .map((key) => customer[key as keyof Customer]);

      if (updateFields.length === 0) {
        return sqliteService.queryOne<Customer>(
          `SELECT * FROM customers WHERE id = ?`,
          [id],
        );
      }

      await sqliteService.execute(
        `UPDATE customers SET ${updateFields} WHERE id = ?`,
        [...updateValues, id],
      );

      return sqliteService.queryOne<Customer>(
        `SELECT * FROM customers WHERE id = ?`,
        [id],
      );
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const result = await sqliteService.execute(
        `DELETE FROM customers WHERE id = ?`,
        [id],
      );
      return (result.changes || 0) > 0;
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },
};
```

**Step 4:** Add service methods in `services/dbService.ts`

```typescript
import { customerRepository } from "../db/repositories/customerRepository";

export const customerDbService = {
  create: async (customerData: any) => {
    const newCustomer = await customerRepository.create(customerData);
    return { data: newCustomer };
  },

  getAll: async () => {
    const customers = await customerRepository.getAll();
    return { data: customers };
  },

  getByEmail: async (email: string) => {
    const customer = await customerRepository.getByEmail(email);
    return { data: customer };
  },

  update: async (id: string, customerData: any) => {
    const updated = await customerRepository.update(id, customerData);
    return { data: updated };
  },

  delete: async (id: string) => {
    const success = await customerRepository.delete(id);
    return { data: { success } };
  },
};
```

**Step 5:** Use in components

```typescript
import { customerDbService } from "../services/dbService";

// Create customer
const newCustomer = await customerDbService.create({
  name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  address: "Main Street",
  total_purchases: 0,
});

// Get all customers
const response = await customerDbService.getAll();
const customers = response.data;

// Update customer
await customerDbService.update(customerId, { total_purchases: 5000 });

// Delete customer
await customerDbService.delete(customerId);
```

---

## Adding Relationships Between Tables

### Example: Link Customers to Bills

**Step 1:** Update bills schema

```typescript
// db/sqlite.ts
CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    customer_id TEXT,  // NEW
    total_amount REAL NOT NULL,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    customer_name TEXT,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL  // NEW
);
```

**Step 2:** Create index for fast lookups

```typescript
// db/sqlite.ts
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);
```

**Step 3:** Update repository to handle relationship

```typescript
// db/repositories/billRepository.ts
async createBill(
    bill: Omit<Bill, 'id' | 'created_at'>,
    items: Omit<BillItem, 'id' | 'bill_id'>[],
    customerId?: string  // NEW
): Promise<Bill> {
    let newBill: Bill | null = null;

    await sqliteService.transaction(async () => {
        const billId = generateId();
        const createdAt = new Date().toISOString();

        await sqliteService.execute(
            `INSERT INTO bills (id, customer_id, total_amount, discount, tax, customer_name, payment_method, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                billId, customerId, bill.total_amount, bill.discount, bill.tax,
                bill.customer_name, 'cash', null, createdAt, createdAt
            ]
        );

        // Insert items...
        for (const item of items) {
            const itemId = generateId();
            await sqliteService.execute(
                `INSERT INTO bill_items (id, bill_id, vegetable_id, quantity, unit_price, total_price, unit, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemId, billId, item.vegetable_id, item.quantity, item.unit_price,
                 item.total_price, item.unit || 'kg', createdAt]
            );
        }

        newBill = { id: billId, total_amount: bill.total_amount,
                   discount: bill.discount, customer_name: bill.customer_name,
                   created_at: createdAt };
    });

    return newBill!;
}

// Get bills for a customer
async getBillsForCustomer(customerId: string): Promise<Bill[]> {
    try {
        const bills = await sqliteService.query<Bill>(
            `SELECT id, total_amount, discount, customer_name, created_at
             FROM bills
             WHERE customer_id = ?
             ORDER BY created_at DESC`,
            [customerId]
        );
        return bills;
    } catch (error) {
        console.error('Error fetching customer bills:', error);
        throw error;
    }
}
```

---

## Advanced: Adding Computed Columns

### Example: Auto-calculate Tax in Bills

```typescript
// db/sqlite.ts - Create a view
CREATE VIEW IF NOT EXISTS bill_summary AS
SELECT
    b.id,
    b.customer_name,
    b.total_amount,
    b.discount,
    ROUND(b.total_amount * 0.05, 2) as calculated_tax,
    ROUND(b.total_amount - b.discount + (b.total_amount * 0.05), 2) as final_total,
    COUNT(bi.id) as item_count,
    b.created_at
FROM bills b
LEFT JOIN bill_items bi ON b.id = bi.bill_id
GROUP BY b.id;
```

**Use in queries:**

```typescript
// Get bill summaries
const summaries = await sqliteService.query(
  `SELECT * FROM bill_summary ORDER BY created_at DESC LIMIT 50`,
);
```

---

## Data Migration Guide

### Scenario: Add New Column Without Losing Data

**Step 1:** Create new temporary table with updated schema

```typescript
// db/sqlite.ts
const backupTableName = "users_backup";
await sqliteService.execute(`ALTER TABLE users RENAME TO ${backupTableName};`);

// Create new table with new schema
await sqliteService.execute(`
    CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'shopkeeper')) DEFAULT 'shopkeeper',
        phone TEXT,  // NEW COLUMN
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

// Copy data from backup
await sqliteService.execute(`
    INSERT INTO users (id, username, password_hash, role, created_at)
    SELECT id, username, password_hash, role, created_at FROM ${backupTableName};
`);

// Drop backup table
await sqliteService.execute(`DROP TABLE ${backupTableName};`);
```

---

## Performance Optimization

### Adding Indexes for Frequently Queried Data

```typescript
// db/sqlite.ts
CREATE INDEX IF NOT EXISTS idx_bills_customer_date ON bills(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_veg_date ON inventory(vegetable_id, date);
```

### Query Optimization Example

```typescript
// SLOW: Loads all bills
const allBills = await billRepository.getHistory();

// FAST: Limits results
const recentBills = await billRepository.getHistory(50);

// FAST: Uses indexed columns
const customerBills = await billRepository.getBillsForCustomer(customerId);
```

---

## Backup & Restore

### Export Database to JSON

```typescript
export const exportDatabase = async () => {
  try {
    const vegetables = await sqliteService.query("SELECT * FROM vegetables");
    const customers = await sqliteService.query("SELECT * FROM customers");
    const bills = await sqliteService.query("SELECT * FROM bills");
    const billItems = await sqliteService.query("SELECT * FROM bill_items");

    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: { vegetables, customers, bills, billItems },
    };

    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
};
```

### Import Database from JSON

```typescript
export const importDatabase = async (jsonData: string) => {
  try {
    const backup = JSON.parse(jsonData);

    await sqliteService.transaction(async () => {
      for (const veg of backup.data.vegetables) {
        await sqliteService.execute(
          `INSERT INTO vegetables (id, name, tamil_name, image_url, category, created_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
          [
            veg.id,
            veg.name,
            veg.tamil_name,
            veg.image_url,
            veg.category,
            veg.created_at,
          ],
        );
      }
      // Repeat for other tables...
    });
  } catch (error) {
    console.error("Import failed:", error);
    throw error;
  }
};
```

---

## Testing Your Changes

```typescript
// Test new column
const testUser = await userRepository.create({
  username: "testuser",
  password_hash: "hash123",
  role: "shopkeeper",
  phone: "9876543210", // NEW
});

console.log("User created with phone:", testUser.phone);

// Test new table
const testCustomer = await customerRepository.create({
  name: "Test Customer",
  phone: "1234567890",
  email: "test@example.com",
  address: "Test Address",
  total_purchases: 0,
});

console.log("Customer created:", testCustomer.id);
```

---

## Summary of Best Practices

1. **Always update schema interface** when modifying tables
2. **Keep repositories consistent** with schema changes
3. **Add indexes** for frequently queried columns
4. **Use transactions** for multi-table operations
5. **Test migrations** before deploying
6. **Document schema changes** for future reference
7. **Backup data** before major migrations
8. **Use foreign keys** for data integrity

---

For more details, see:

- `ARCHITECTURE.md` - System design
- `OFFLINE_MIGRATION_GUIDE.md` - General guide
- `db/sqlite.ts` - Database service implementation
