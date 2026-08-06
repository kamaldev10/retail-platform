CREATE TABLE IF NOT EXISTS gasoline.shift_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_date VARCHAR(10) NOT NULL,
    transaction_date VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'pour')),
    product_id VARCHAR(50),
    liters DOUBLE PRECISION,
    quantity DOUBLE PRECISION,
    cost DOUBLE PRECISION NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
