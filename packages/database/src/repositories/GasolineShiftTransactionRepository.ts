import { query } from '../connection'

export interface ShiftTransactionRow {
	id?: string
	shift_date: string
	transaction_date: string
	type: 'purchase' | 'pour'
	product_id?: string
	liters?: number
	quantity?: number
	cost: number
	note?: string
	created_at?: string
}

export const gasolineShiftTransactionRepository = {
	async findByShiftDate(shiftDate: string): Promise<ShiftTransactionRow[]> {
		const res = await query(
			`SELECT id, shift_date, transaction_date, type, product_id, liters, quantity, cost, note, created_at
             FROM gasoline.shift_transactions
             WHERE shift_date = $1
             ORDER BY created_at ASC`,
			[shiftDate],
		)
		return res.rows.map((r: any) => ({
			id: r.id,
			shift_date: r.shift_date,
			transaction_date: r.transaction_date,
			type: r.type as 'purchase' | 'pour',
			product_id: r.product_id,
			liters: r.liters ? Number(r.liters) : undefined,
			quantity: r.quantity ? Number(r.quantity) : undefined,
			cost: Number(r.cost),
			note: r.note,
			created_at: r.created_at,
		}))
	},

	async insert(tx: Omit<ShiftTransactionRow, 'id' | 'created_at'>): Promise<ShiftTransactionRow> {
		const res = await query(
			`INSERT INTO gasoline.shift_transactions (shift_date, transaction_date, type, product_id, liters, quantity, cost, note)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
			[
				tx.shift_date,
				tx.transaction_date,
				tx.type,
				tx.product_id || null,
				tx.liters || null,
				tx.quantity || null,
				tx.cost,
				tx.note || null,
			],
		)
		const r = res.rows[0]
		return { ...r, cost: Number(r.cost) }
	},

	async deleteByShiftDate(shiftDate: string): Promise<void> {
		await query(`DELETE FROM gasoline.shift_transactions WHERE shift_date = $1`, [shiftDate])
	},
}
