-- Migration: 0004_gasoline_live_stock.sql
-- Description: Live stock table for direct adjustment persistence (jerigen + bottle stocks)

CREATE TABLE IF NOT EXISTS gasoline.live_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(50) UNIQUE NOT NULL,
    quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed jerigen as a special product_id = '__jerigen__'
INSERT INTO gasoline.live_stock (product_id, quantity)
VALUES ('__jerigen__', 0)
ON CONFLICT (product_id) DO NOTHING;
