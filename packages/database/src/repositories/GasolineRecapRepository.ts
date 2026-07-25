import { query, transaction } from '../connection'

export interface GasolineProductRecapRow {
	id?: string
	recap_id?: string
	productId: string
	openingStock: number
	closingStock: number
	soldQty: number
	revenue: number
	capital: number
	profit: number
}

export interface GasolineRecapRow {
	id: string
	date: string
	totalSoldLiters: number
	totalRevenue: number
	totalCapital: number
	totalNetProfit: number
	cashSummary: {
		cashIn: number
		cashOut: number
		netFinanceFlow: number
	}
	uangAwal: number
	belanja: number
	note: string
	items: GasolineProductRecapRow[]
}

export interface SyncRecapItemInput {
	productId: string
	openingStock: number
	closingStock: number
	soldQty?: number
	revenue?: number
	capital?: number
	profit?: number
}

export interface SyncRecapInput {
	id?: string
	date: string
	totalSoldLiters: number
	totalRevenue: number
	totalCapital: number
	totalNetProfit: number
	cashSummary: {
		cashIn: number
		cashOut: number
		netFinanceFlow: number
	}
	uangAwal?: number
	belanja?: number
	note?: string
	items: SyncRecapItemInput[]
}

export const gasolineRecapRepository = {
	async findAllRecaps(): Promise<GasolineRecapRow[]> {
		const recapRes = await query(
			`SELECT id, date, total_sold_liters, total_revenue, total_capital, total_net_profit,
              cash_in, cash_out, net_finance_flow, uang_awal, belanja, note
       FROM gasoline.recaps
       ORDER BY date DESC`,
		)

		if (recapRes.rows.length === 0) {
			return []
		}

		const recapIds = recapRes.rows.map((r: any) => r.id)

		const itemsRes = await query(
			`SELECT id, recap_id, product_id, opening_stock, closing_stock, sold_qty, revenue, capital, profit
       FROM gasoline.product_recaps
       WHERE recap_id = ANY($1::uuid[])`,
			[recapIds],
		)

		const itemsByRecapId = new Map<string, GasolineProductRecapRow[]>()
		for (const item of itemsRes.rows) {
			const list = itemsByRecapId.get(item.recap_id) || []
			list.push({
				id: item.id,
				recap_id: item.recap_id,
				productId: item.product_id,
				openingStock: Number(item.opening_stock),
				closingStock: Number(item.closing_stock),
				soldQty: Number(item.sold_qty),
				revenue: Number(item.revenue),
				capital: Number(item.capital),
				profit: Number(item.profit),
			})
			itemsByRecapId.set(item.recap_id, list)
		}

		return recapRes.rows.map((r: any) => ({
			id: r.id,
			date: r.date,
			totalSoldLiters: Number(r.total_sold_liters),
			totalRevenue: Number(r.total_revenue),
			totalCapital: Number(r.total_capital),
			totalNetProfit: Number(r.total_net_profit),
			cashSummary: {
				cashIn: Number(r.cash_in),
				cashOut: Number(r.cash_out),
				netFinanceFlow: Number(r.net_finance_flow),
			},
			uangAwal: Number(r.uang_awal || 0),
			belanja: Number(r.belanja || 0),
			note: r.note || '',
			items: itemsByRecapId.get(r.id) || [],
		}))
	},

	async syncBatch(recaps: SyncRecapInput[]): Promise<number> {
		if (recaps.length === 0) return 0

		return await transaction(async client => {
			let count = 0

			for (const recap of recaps) {
				const recapRes = await client.query(
					`INSERT INTO gasoline.recaps (
            date, total_sold_liters, total_revenue, total_capital, total_net_profit,
            cash_in, cash_out, net_finance_flow, uang_awal, belanja, note, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
          ON CONFLICT (date) DO UPDATE SET
            total_sold_liters = EXCLUDED.total_sold_liters,
            total_revenue = EXCLUDED.total_revenue,
            total_capital = EXCLUDED.total_capital,
            total_net_profit = EXCLUDED.total_net_profit,
            cash_in = EXCLUDED.cash_in,
            cash_out = EXCLUDED.cash_out,
            net_finance_flow = EXCLUDED.net_finance_flow,
            uang_awal = EXCLUDED.uang_awal,
            belanja = EXCLUDED.belanja,
            note = EXCLUDED.note,
            updated_at = NOW()
          RETURNING id`,
					[
						recap.date,
						recap.totalSoldLiters,
						recap.totalRevenue,
						recap.totalCapital,
						recap.totalNetProfit,
						recap.cashSummary.cashIn,
						recap.cashSummary.cashOut,
						recap.cashSummary.netFinanceFlow,
						recap.uangAwal || 0,
						recap.belanja || 0,
						recap.note || null,
					],
				)

				const recapId = recapRes.rows[0].id

				await client.query(`DELETE FROM gasoline.product_recaps WHERE recap_id = $1`, [recapId])

				for (const item of recap.items) {
					await client.query(
						`INSERT INTO gasoline.product_recaps (
              recap_id, product_id, opening_stock, closing_stock, sold_qty, revenue, capital, profit
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
						[
							recapId,
							item.productId,
							item.openingStock,
							item.closingStock,
							item.soldQty || 0,
							item.revenue || 0,
							item.capital || 0,
							item.profit || 0,
						],
					)
				}

				count++
			}

			return count
		})
	},

	async deleteRecapByDate(date: string): Promise<boolean> {
		const res = await query(`DELETE FROM gasoline.recaps WHERE date = $1`, [date])
		return (res.rowCount ?? 0) > 0
	},
}
