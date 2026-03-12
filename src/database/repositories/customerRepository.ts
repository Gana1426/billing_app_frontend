import { generateId } from '@/utils/idGenerator';
import { sqliteService } from '../sqlite';

export type Customer = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    created_at: string;
};

export const customerRepository = {
    async getAll(): Promise<Customer[]> {
        return sqliteService.query<Customer>(
            `SELECT * FROM customers ORDER BY name ASC`
        );
    },

    async getById(id: string): Promise<Customer | null> {
        return sqliteService.queryOne<Customer>(
            `SELECT * FROM customers WHERE id = ?`,
            [id]
        );
    },

    async create(data: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
        const id = generateId();
        const created_at = new Date().toISOString();
        await sqliteService.execute(
            `INSERT INTO customers (id, name, phone, address, created_at) VALUES (?, ?, ?, ?, ?)`,
            [id, data.name, data.phone || null, data.address || null, created_at]
        );
        return { id, ...data, created_at };
    },

    async update(id: string, data: Partial<Omit<Customer, 'id' | 'created_at'>>): Promise<Customer | null> {
        const customer = await this.getById(id);
        if (!customer) return null;

        const newName = data.name !== undefined ? data.name : customer.name;
        const newPhone = data.phone !== undefined ? data.phone : customer.phone;
        const newAddress = data.address !== undefined ? data.address : customer.address;

        await sqliteService.execute(
            `UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?`,
            [newName, newPhone, newAddress, id]
        );

        return { ...customer, name: newName, phone: newPhone, address: newAddress };
    },

    async delete(id: string): Promise<void> {
        await sqliteService.execute(`DELETE FROM customers WHERE id = ?`, [id]);
    }
};
