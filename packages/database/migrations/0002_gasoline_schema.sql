-- Migration: 0002_gasoline_schema.sql
-- Description: Gasoline Web Schema (Shift recaps, product opname, salary payments)

CREATE SCHEMA IF NOT EXISTS gasoline;

CREATE TABLE IF NOT EXISTS gasoline.recaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date VARCHAR(10) UNIQUE NOT NULL,
    total_sold_liters DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_revenue DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_capital DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_net_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
    cash_in DOUBLE PRECISION NOT NULL DEFAULT 0,
    cash_out DOUBLE PRECISION NOT NULL DEFAULT 0,
    net_finance_flow DOUBLE PRECISION NOT NULL DEFAULT 0,
    uang_awal DOUBLE PRECISION NOT NULL DEFAULT 0,
    belanja DOUBLE PRECISION NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gasoline.product_recaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recap_id UUID NOT NULL REFERENCES gasoline.recaps(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    opening_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
    closing_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
    sold_qty DOUBLE PRECISION NOT NULL DEFAULT 0,
    revenue DOUBLE PRECISION NOT NULL DEFAULT 0,
    capital DOUBLE PRECISION NOT NULL DEFAULT 0,
    profit DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gasoline.salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date VARCHAR(10) NOT NULL,
    week_label VARCHAR(100),
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    recipient VARCHAR(100),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
