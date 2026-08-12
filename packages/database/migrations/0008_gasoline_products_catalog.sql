-- Migration: 0008_gasoline_products_catalog.sql
-- Description: Gasoline Product Catalog Persistence Table

CREATE TABLE IF NOT EXISTS gasoline.products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    volume DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    selling_price DOUBLE PRECISION NOT NULL DEFAULT 0,
    cost_price DOUBLE PRECISION NOT NULL DEFAULT 0,
    margin DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default products if empty
INSERT INTO gasoline.products (id, name, volume, selling_price, cost_price, margin)
VALUES
    ('p1', 'Premium 1L', 1.0, 12000, 10000, 2000),
    ('p2', 'Premium 1.2L', 1.2, 15000, 12000, 3000),
    ('p3', 'Premium 1.5L', 1.5, 20000, 15000, 5000)
ON CONFLICT (id) DO NOTHING;
