import { query } from '../connection'

export interface ProductDbRow {
	id: string
	name: string
	volume: number
	selling_price: number
	cost_price: number
	margin: number
	created_at?: string
	updated_at?: string
}

export const gasolineProductRepository = {
	async getAll(): Promise<ProductDbRow[]> {
		const res = await query(
			`SELECT id, name, volume, selling_price, cost_price, margin FROM gasoline.products ORDER BY created_at ASC, id ASC`,
		)
		return res.rows.map(r => ({
			id: r.id,
			name: r.name,
			volume: Number(r.volume),
			selling_price: Number(r.selling_price),
			cost_price: Number(r.cost_price),
			margin: Number(r.margin),
		}))
	},

	async upsert(
		product: Omit<ProductDbRow, 'created_at' | 'updated_at'> & { id: string },
	): Promise<ProductDbRow> {
		const res = await query(
			`INSERT INTO gasoline.products (id, name, volume, selling_price, cost_price, margin, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           volume = EXCLUDED.volume,
           selling_price = EXCLUDED.selling_price,
           cost_price = EXCLUDED.cost_price,
           margin = EXCLUDED.margin,
           updated_at = NOW()
       RETURNING id, name, volume, selling_price, cost_price, margin`,
			[
				product.id,
				product.name,
				product.volume,
				product.selling_price,
				product.cost_price,
				product.margin,
			],
		)
		const r = res.rows[0]
		return {
			id: r.id,
			name: r.name,
			volume: Number(r.volume),
			selling_price: Number(r.selling_price),
			cost_price: Number(r.cost_price),
			margin: Number(r.margin),
		}
	},

	async delete(id: string): Promise<boolean> {
		const res = await query(`DELETE FROM gasoline.products WHERE id = $1`, [id])
		return (res.rowCount ?? 0) > 0
	},
}
