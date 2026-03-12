import { generateId } from '@/utils/idGenerator';
import { User } from '../schema/users';
import { sqliteService } from '../sqlite';

export const userRepository = {
    async getByUsername(username: string): Promise<User | null> {
        try {
            const user = await sqliteService.queryOne<User>(
                `SELECT * FROM users WHERE username = ?`,
                [username]
            );
            return user || null;
        } catch (error) {
            console.error('Error fetching user by username:', error);
            throw error;
        }
    },

    async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
        try {
            const id = generateId();
            const createdAt = new Date().toISOString();

            await sqliteService.execute(
                `INSERT INTO users (id, username, password_hash, role, shop_name, phone, address, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id, 
                    user.username, 
                    user.password_hash, 
                    user.role || 'shopkeeper',
                    user.shop_name || '',
                    user.phone || '',
                    user.address || '',
                    createdAt
                ],
                { silent: true }
            );

            return {
                id,
                username: user.username,
                password_hash: user.password_hash,
                role: user.role || 'shopkeeper',
                shop_name: user.shop_name,
                phone: user.phone,
                address: user.address,
                created_at: createdAt
            };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    async getById(id: string): Promise<User | null> {
        try {
            const user = await sqliteService.queryOne<User>(
                `SELECT * FROM users WHERE id = ?`,
                [id]
            );
            return user || null;
        } catch (error) {
            console.error('Error fetching user by id:', error);
            throw error;
        }
    },

    async update(id: string, user: Partial<User>): Promise<User | null> {
        try {
            const updateFields = Object.keys(user)
                .filter(key => user[key as keyof User] !== undefined && key !== 'id' && key !== 'created_at')
                .map(key => `${key} = ?`)
                .join(', ');

            const updateValues = Object.keys(user)
                .filter(key => user[key as keyof User] !== undefined && key !== 'id' && key !== 'created_at')
                .map(key => user[key as keyof User]);

            if (updateFields.length === 0) {
                return this.getById(id);
            }

            await sqliteService.execute(
                `UPDATE users SET ${updateFields} WHERE id = ?`,
                [...updateValues, id]
            );

            return this.getById(id);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            const result = await sqliteService.execute(
                `DELETE FROM users WHERE id = ?`,
                [id]
            );
            return (result.changes || 0) > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    async getAll(): Promise<User[]> {
        try {
            const users = await sqliteService.query<User>(
                `SELECT * FROM users ORDER BY created_at DESC`
            );
            return users;
        } catch (error) {
            console.error('Error fetching all users:', error);
            throw error;
        }
    }
};
