import { query } from '../connection'

export interface ActiveShiftRow {
	active_date: string
	cash_in: number
	cash_out: number
	opening_stocks: Record<string, number>
	pushed_bottles: Record<string, number>
}

export const gasolineActiveShiftRepository = {
	async get(): Promise<ActiveShiftRow | null> {
		const res = await query(
			`SELECT active_date, cash_in, cash_out, opening_stocks, pushed_bottles FROM gasoline.active_shift LIMIT 1`,
		)
		if (res.rows.length === 0) return null
		const r = res.rows[0]
		return {
			active_date: r.active_date,
			cash_in: Number(r.cash_in),
			cash_out: Number(r.cash_out),
			opening_stocks: r.opening_stocks as Record<string, number>,
			pushed_bottles: r.pushed_bottles as Record<string, number>,
		}
	},

	async upsert(data: ActiveShiftRow): Promise<void> {
		await query(
			`INSERT INTO gasoline.active_shift (active_date, cash_in, cash_out, opening_stocks, pushed_bottles, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT ((true)) DO UPDATE SET
               active_date = EXCLUDED.active_date,
               cash_in = EXCLUDED.cash_in,
               cash_out = EXCLUDED.cash_out,
               opening_stocks = EXCLUDED.opening_stocks,
               pushed_bottles = EXCLUDED.pushed_bottles,
               updated_at = NOW()`,
			[
				data.active_date,
				data.cash_in,
				data.cash_out,
				JSON.stringify(data.opening_stocks),
				JSON.stringify(data.pushed_bottles),
			],
		)
	},

	async clear(): Promise<void> {
		await query(`DELETE FROM gasoline.active_shift`)
	},
}
