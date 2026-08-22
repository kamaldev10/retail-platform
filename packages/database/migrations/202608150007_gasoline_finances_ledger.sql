-- Migration: 0007_gasoline_finances_ledger.sql
-- Description: Central Financial Ledger table (gasoline.finances), English column refactoring, and historical data migration

-- 1. Create gasoline.finances central ledger table
CREATE TABLE IF NOT EXISTS gasoline.finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    flow_type VARCHAR(10) NOT NULL CHECK (flow_type IN ('IN', 'OUT')),
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'SALES_REVENUE',
        'FUEL_PURCHASE',
        'SALARY_PAYMENT',
        'INITIAL_CASH',
        'CAPITAL_INJECTION',
        'OWNER_WITHDRAWAL',
        'OTHER'
    )),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'TRANSFER', 'QRIS')),
    
    reference_type VARCHAR(30) CHECK (reference_type IN ('RECAP', 'SALARY', 'SHIFT_TRANSACTION', 'MANUAL')),
    reference_id UUID,
    
    recap_id UUID REFERENCES gasoline.recaps(id) ON DELETE SET NULL,
    salary_id UUID REFERENCES gasoline.salary_payments(id) ON DELETE SET NULL,
    shift_transaction_id UUID REFERENCES gasoline.shift_transactions(id) ON DELETE SET NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED')),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_gasoline_finances_flow_category CHECK (
        (flow_type = 'IN'  AND category IN ('SALES_REVENUE', 'INITIAL_CASH', 'CAPITAL_INJECTION', 'OTHER')) OR
        (flow_type = 'OUT' AND category IN ('FUEL_PURCHASE', 'SALARY_PAYMENT', 'OWNER_WITHDRAWAL', 'OTHER'))
    )
);

-- 2. Indexes for fast financial reports & ledger lookup
CREATE INDEX IF NOT EXISTS idx_gasoline_finances_date ON gasoline.finances(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_gasoline_finances_category ON gasoline.finances(category);
CREATE INDEX IF NOT EXISTS idx_gasoline_finances_flow ON gasoline.finances(flow_type);
CREATE INDEX IF NOT EXISTS idx_gasoline_finances_recap_id ON gasoline.finances(recap_id) WHERE recap_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gasoline_finances_salary_id ON gasoline.finances(salary_id) WHERE salary_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gasoline_product_recaps_recap_id ON gasoline.product_recaps(recap_id);
CREATE INDEX IF NOT EXISTS idx_gasoline_shift_transactions_shift_date ON gasoline.shift_transactions(shift_date DESC);

-- 3. Refactor non-English columns in gasoline.recaps (uang_awal & belanja)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='gasoline' AND table_name='recaps' AND column_name='uang_awal') THEN
        ALTER TABLE gasoline.recaps RENAME COLUMN uang_awal TO initial_cash_balance;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='gasoline' AND table_name='recaps' AND column_name='belanja') THEN
        ALTER TABLE gasoline.recaps RENAME COLUMN belanja TO fuel_purchase_cost;
    END IF;
END $$;

-- 4. Migrate historical data into gasoline.finances idempotently

-- 4a. Migrate initial cash float (initial_cash_balance)
INSERT INTO gasoline.finances (transaction_date, flow_type, category, amount, reference_type, reference_id, recap_id, description)
SELECT 
    TO_DATE(r.date, 'YYYY-MM-DD'),
    'IN',
    'INITIAL_CASH',
    r.initial_cash_balance,
    'RECAP',
    r.id,
    r.id,
    'Initial cash float for shift on ' || r.date
FROM gasoline.recaps r
WHERE r.initial_cash_balance > 0
  AND NOT EXISTS (
      SELECT 1 FROM gasoline.finances f WHERE f.recap_id = r.id AND f.category = 'INITIAL_CASH'
  );

-- 4b. Migrate fuel purchase expenses (fuel_purchase_cost)
INSERT INTO gasoline.finances (transaction_date, flow_type, category, amount, reference_type, reference_id, recap_id, description)
SELECT 
    TO_DATE(r.date, 'YYYY-MM-DD'),
    'OUT',
    'FUEL_PURCHASE',
    r.fuel_purchase_cost,
    'RECAP',
    r.id,
    r.id,
    'Bulk fuel purchase expense for recap ' || r.date
FROM gasoline.recaps r
WHERE r.fuel_purchase_cost > 0
  AND NOT EXISTS (
      SELECT 1 FROM gasoline.finances f WHERE f.recap_id = r.id AND f.category = 'FUEL_PURCHASE'
  );

-- 4c. Migrate sales revenue (total_revenue)
INSERT INTO gasoline.finances (transaction_date, flow_type, category, amount, reference_type, reference_id, recap_id, description)
SELECT 
    TO_DATE(r.date, 'YYYY-MM-DD'),
    'IN',
    'SALES_REVENUE',
    r.total_revenue,
    'RECAP',
    r.id,
    r.id,
    'Sales revenue for shift recap on ' || r.date
FROM gasoline.recaps r
WHERE r.total_revenue > 0
  AND NOT EXISTS (
      SELECT 1 FROM gasoline.finances f WHERE f.recap_id = r.id AND f.category = 'SALES_REVENUE'
  );

-- 4d. Migrate salary payments (gasoline.salary_payments)
INSERT INTO gasoline.finances (transaction_date, flow_type, category, amount, reference_type, reference_id, salary_id, description)
SELECT 
    TO_DATE(s.date, 'YYYY-MM-DD'),
    'OUT',
    'SALARY_PAYMENT',
    s.amount,
    'SALARY',
    s.id,
    s.id,
    'Salary payment to ' || COALESCE(s.recipient, 'Employee') || ' (' || COALESCE(s.week_label, '') || ')'
FROM gasoline.salary_payments s
WHERE s.amount > 0
  AND NOT EXISTS (
      SELECT 1 FROM gasoline.finances f WHERE f.salary_id = s.id AND f.category = 'SALARY_PAYMENT'
  );
