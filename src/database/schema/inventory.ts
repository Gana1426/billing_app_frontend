export interface Inventory {
    id: string;
    vegetable_id: string;
    price: number;
    stock_quantity: number;
    unit: 'kg' | 'piece' | 'bundle';
    date: string; // ISO string or YYYY-MM-DD
    created_at?: string;
}
