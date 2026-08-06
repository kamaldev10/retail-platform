CREATE TABLE IF NOT EXISTS gasoline.active_shift (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active_date VARCHAR(10) NOT NULL,
    cash_in DOUBLE PRECISION NOT NULL DEFAULT 0,
    cash_out DOUBLE PRECISION NOT NULL DEFAULT 0,
    opening_stocks JSONB NOT NULL DEFAULT '{}',
    pushed_bottles JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Only one active shift at a time
CREATE UNIQUE INDEX IF NOT EXISTS gasoline_active_shift_singleton ON gasoline.active_shift ((true));
