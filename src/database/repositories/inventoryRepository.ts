import { generateId } from '@/utils/idGenerator';
import { Inventory } from '../schema/inventory';
import { sqliteService } from '../sqlite';

export const inventoryRepository = {
    async create(inventory: Omit<Inventory, 'id' | 'created_at'>): Promise<Inventory> {
        try {
            const id = generateId();
            const createdAt = new Date().toISOString();

            await sqliteService.execute(
                `INSERT INTO inventory (id, vegetable_id, price, stock_quantity, unit, date, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, inventory.vegetable_id, inventory.price, inventory.stock_quantity, inventory.unit, inventory.date, createdAt]
            );

            return {
                id,
                vegetable_id: inventory.vegetable_id,
                price: inventory.price,
                stock_quantity: inventory.stock_quantity,
                unit: inventory.unit,
                date: inventory.date,
                created_at: createdAt
            };
        } catch (error) {
            console.error('Error creating inventory:', error);
            throw error;
        }
    },

    async getByDate(date: string): Promise<Inventory[]> {
        try {
            const inventory = await sqliteService.query<Inventory>(
                `SELECT * FROM inventory WHERE date = ? ORDER BY created_at DESC`,
                [date]
            );
            return inventory;
        } catch (error) {
            console.error('Error fetching inventory by date:', error);
            throw error;
        }
    },

    async getLatestPrices(): Promise<Inventory[]> {
        try {
            // SQLite version - get the latest price for each vegetable
            const inventory = await sqliteService.query<Inventory & { name: string, tamil_name: string, category: string, wholesale_price: number, retail_price: number }>(
                `SELECT i.*, v.name, v.tamil_name, v.category, v.wholesale_price, v.retail_price 
                 FROM (
                    SELECT *, ROW_NUMBER() OVER (PARTITION BY vegetable_id ORDER BY date DESC, created_at DESC) as rn
                    FROM inventory
                 ) i
                 JOIN vegetables v ON i.vegetable_id = v.id
                 WHERE i.rn = 1 
                 ORDER BY i.created_at DESC`
            );
            return inventory;
        } catch (error) {
            console.error('Error fetching latest prices:', error);
            throw error;
        }
    },

    async updatePriceAndStock(data: Omit<Inventory, 'id' | 'created_at'>): Promise<Inventory> {
        try {
            // Insert new record (new version of the price/stock for that date)
            return this.create(data);
        } catch (error) {
            console.error('Error updating price and stock:', error);
            throw error;
        }
    },

    async getByVegetableId(vegetableId: string): Promise<Inventory[]> {
        try {
            const inventory = await sqliteService.query<Inventory>(
                `SELECT * FROM inventory WHERE vegetable_id = ? ORDER BY date DESC`,
                [vegetableId]
            );
            return inventory;
        } catch (error) {
            console.error('Error fetching inventory by vegetable:', error);
            throw error;
        }
    },

    async getCurrentPriceForVegetable(vegetableId: string): Promise<Inventory | null> {
        try {
            const inventory = await sqliteService.queryOne<Inventory>(
                `SELECT * FROM inventory 
                 WHERE vegetable_id = ? 
                 ORDER BY date DESC, created_at DESC 
                 LIMIT 1`,
                [vegetableId]
            );
            return inventory || null;
        } catch (error) {
            console.error('Error fetching current price:', error);
            throw error;
        }
    },

    async update(id: string, inventory: Partial<Inventory>): Promise<Inventory | null> {
        try {
            const updateFields = Object.keys(inventory)
                .filter(key => inventory[key as keyof Inventory] !== undefined && key !== 'id' && key !== 'created_at')
                .map(key => `${key} = ?`)
                .join(', ');

            const updateValues = Object.keys(inventory)
                .filter(key => inventory[key as keyof Inventory] !== undefined && key !== 'id' && key !== 'created_at')
                .map(key => inventory[key as keyof Inventory]);

            if (updateFields.length === 0) {
                return sqliteService.queryOne<Inventory>(
                    `SELECT * FROM inventory WHERE id = ?`,
                    [id]
                );
            }

            await sqliteService.execute(
                `UPDATE inventory SET ${updateFields} WHERE id = ?`,
                [...updateValues, id]
            );

            return sqliteService.queryOne<Inventory>(
                `SELECT * FROM inventory WHERE id = ?`,
                [id]
            );
        } catch (error) {
            console.error('Error updating inventory:', error);
            throw error;
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            const result = await sqliteService.execute(
                `DELETE FROM inventory WHERE id = ?`,
                [id]
            );
            return (result.changes || 0) > 0;
        } catch (error) {
            console.error('Error deleting inventory:', error);
            throw error;
        }
    }
};
