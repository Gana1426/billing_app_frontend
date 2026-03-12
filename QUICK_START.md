# Quick Start Guide - Offline Billing App

## 5-Minute Setup

### 1. Install & Run

```bash
# Install dependencies
npm install

# Start the app
npx expo start

# Select platform:
# - 'i' for iOS
# - 'a' for Android
# - 'w' for Web
```

### 2. Login

```
Username: admin
Password: admin123
```

## Features

### ✓ Fully Offline

No internet required. All data stored locally in SQLite on your phone.

### ✓ Quick Billing

- Add vegetables to cart
- Set quantities and prices
- Generate bills instantly
- PDF download support

### ✓ Complete History

- View all past bills
- Search and filter
- Access anytime

### ✓ Inventory Management

- Update prices daily
- Track stock levels
- Manage products

## Key Screens

### Login Screen

- Local authentication
- Demo credentials included
- Theme and language toggle

### Billing Screen

- Product catalog
- Shopping cart
- Bill preview
- PDF generation

### History Screen

- All past bills
- Date sorting
- Bill details view

## Common Tasks

### Create a Bill

1. Go to Shop tab
2. Add vegetables to cart
3. Adjust quantities
4. Click "Finalize Bill"
5. Confirm and generate

### View Bill History

1. Go to History tab
2. Tap on any bill to view details
3. Download as PDF (if needed)

### Manage Inventory

1. Admin panel
2. Update prices
3. Check stock levels

### Add New Product

1. Admin panel
2. Add vegetable
3. Set initial price
4. Product available in shop

## File Structure

```
Key folders:

db/                    # Database & data layer
├── sqlite.ts          # SQLite service
├── repositories/      # Data access layer
└── schema/           # Data types

services/
├── dbService.ts      # Business logic
└── storage.ts        # Local storage

app/
├── login.tsx         # Login screen
└── shop/             # Billing screens
    ├── index.tsx     # Billing page
    └── history.tsx   # Bill history
```

## Database Info

**Database File:** `billing_app.db`  
**Location:** Device storage (invisible to user)

**Tables:**

- `users` - Users & login
- `vegetables` - Products
- `inventory` - Prices & stock
- `bills` - Invoice headers
- `bill_items` - Line items

## Development

### Using the Database

```typescript
// Import services
import { billDbService } from "@/services/dbService";
import { billRepository } from "@/db/repositories/billRepository";

// Get bills
const response = await billDbService.getHistory();

// Create bill
await billDbService.create(billData);

// Raw queries (if needed)
import { sqliteService } from "@/db/sqlite";
const results = await sqliteService.query("SELECT * FROM bills");
```

### Adding Features

1. **Create new repository** in `db/repositories/`
2. **Add service methods** in `services/dbService.ts`
3. **Use in components** via service layer
4. **Update database schema** in `db/sqlite.ts` if needed

## Troubleshooting

### App won't start

```
Solution: npx expo start --clear
```

### Login not working

```
Check credentials:
- admin / admin123
- shopkeeper / shop123
```

### Database errors

```
Reset database:
import { sqliteService } from '@/db/sqlite';
await sqliteService.resetDatabase();
```

### PDF generation issues

```
Check file permissions
Make sure expo-print is installed
```

## Performance Tips

- Limit bill history fetch to 50 items
- Use categories to filter products
- Clear cache regularly (optional)
- Close unused modals

## Default Test Data

```
Vegetables:
- Tomato (தக்காளி)
- Onion (வெங்காயம்)
- Potato (உருளைக்கிழங்கு)
... 10 more

Users:
- admin (admin@shop)
- shopkeeper (shop@shop)

Initial Prices: ₹20-50
Stock: 100kg each
```

## What's Different from Backend Version

| Feature           | Backend API        | Offline SQLite      |
| ----------------- | ------------------ | ------------------- |
| Internet Required | Yes                | **No** ✓            |
| Latency           | Network dependent  | **Instant** ✓       |
| Storage           | PostgreSQL server  | **Device SQLite** ✓ |
| Sync              | Always from server | **Local only** ✓    |
| Offline Support   | No                 | **Yes** ✓           |
| Data Size         | Unlimited          | ~100MB typical      |
| Setup             | Complex            | **Simple** ✓        |

## Next Steps

1. ✓ Run the app
2. ✓ Login with credentials
3. ✓ Create a sample bill
4. ✓ View bill history
5. Read `OFFLINE_MIGRATION_GUIDE.md` for details
6. Read `ARCHITECTURE.md` for system design

## Support

**Issues?**

- Check logs: `npx expo start -- --clear`
- Review `OFFLINE_MIGRATION_GUIDE.md`
- Check `ARCHITECTURE.md` for system design

**Questions?**

- See code comments
- Check service implementations
- Review database schema

## Pro Tips

💡 **Session Persistence**

- Logged-in users persist across app restarts
- Credentials stored securely in AsyncStorage

💡 **Bill Data**

- Bills saved immediately upon checkout
- No sync delays
- 100% reliable local storage

💡 **Customization**

- Edit `db/seed.ts` to change initial data
- Modify `db/schema/` to extend data model
- Extend `services/dbService.ts` for new operations

💡 **Performance**

- SQLite queries are extremely fast
- Indexes optimize common searches
- Transactions ensure data consistency

---

**Enjoy your fully offline billing app!** 🚀
