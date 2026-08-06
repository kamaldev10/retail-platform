import { query } from '../connection'

export interface LiveStockRow {
	product_id: string
	quantity: number
}

export const gasolineLiveStockRepository = {
	async getAll(): Promise<LiveStockRow[]> {
		const res = await query(
			`SELECT product_id, quantity FROM gasoline.live_stock ORDER BY product_id`,
		)
		return res.rows.map(r => ({
			product_id: r.product_id,
			quantity: Number(r.quantity),
		}))
	},

	async upsertMany(stocks: LiveStockRow[]): Promise<void> {
		if (stocks.length === 0) return

		for (const stock of stocks) {
			await query(
				`INSERT INTO gasoline.live_stock (product_id, quantity, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (product_id) DO UPDATE
         SET quantity = EXCLUDED.quantity, updated_at = NOW()`,
				[stock.product_id, stock.quantity],
			)
		}
	},
}
