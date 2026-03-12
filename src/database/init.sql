-- SQL Migration for Billing App with Neon DB

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'shopkeeper')) NOT NULL DEFAULT 'shopkeeper',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vegetables Table
CREATE TABLE IF NOT EXISTS vegetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tamil_name TEXT NOT NULL,
    image_url TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Table (Daily Prices and Stock)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vegetable_id UUID REFERENCES vegetables(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit TEXT CHECK (unit IN ('kg', 'piece', 'bundle')) NOT NULL DEFAULT 'kg',
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vegetable_id, date)
);

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_amount DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    customer_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bill Items Table
CREATE TABLE IF NOT EXISTS bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    vegetable_id UUID REFERENCES vegetables(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

-- Insert Initial Vegetables from frontend constants if needed
-- This can be done via a script using the repository later

-- SUPABASE NOTE: 
-- 1. Run these commands in the Supabase SQL Editor.
-- 2. By default, Row Level Security (RLS) is enabled in Supabase.
--    You can disable it for these tables to start testing quickly:
--    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE vegetables DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE bill_items DISABLE ROW LEVEL SECURITY;
