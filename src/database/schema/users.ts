export interface User {
    id: string;
    username: string;
    password_hash: string;
    role: 'admin' | 'shopkeeper';
    shop_name?: string;
    phone?: string;
    address?: string;
    created_at: string;
}
