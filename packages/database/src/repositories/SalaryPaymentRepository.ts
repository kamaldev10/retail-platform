import { query, transaction } from '../connection'

export interface SalaryPaymentRow {
	id: string
	date: string
	weekLabel?: string
	amount: number
	recipient?: string
	note?: string
	createdAt?: Date
	updatedAt?: Date
}

export const salaryPaymentRepository = {
	async findAllSalaries(): Promise<SalaryPaymentRow[]> {
		const res = await query(
			`SELECT id, date, week_label, amount, recipient, note, created_at, updated_at
       FROM gasoline.salary_payments
       ORDER BY date DESC, created_at DESC`,
		)

		return res.rows.map((row: any) => ({
			id: row.id,
			date: row.date,
			weekLabel: row.week_label || undefined,
			amount: Number(row.amount),
			recipient: row.recipient || undefined,
			note: row.note || undefined,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}))
	},

	async createSalary(data: {
		date: string
		weekLabel?: string
		amount: number
		recipient?: string
		note?: string
	}): Promise<SalaryPaymentRow> {
		return await transaction(async client => {
			const res = await client.query(
				`INSERT INTO gasoline.salary_payments (date, week_label, amount, recipient, note, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, date, week_label, amount, recipient, note, created_at, updated_at`,
				[data.date, data.weekLabel || null, data.amount, data.recipient || null, data.note || null],
			)

			const row = res.rows[0]

			if (data.amount > 0) {
				await client.query(
					`INSERT INTO gasoline.finances (
            transaction_date, flow_type, category, amount, reference_type, reference_id, salary_id, description
          ) VALUES ($1::date, 'OUT', 'SALARY_PAYMENT', $2, 'SALARY', $3, $3, $4)`,
					[
						data.date,
						data.amount,
						row.id,
						`Salary payment to ${data.recipient || 'Employee'} (${data.weekLabel || ''})`,
					],
				)
			}

			return {
				id: row.id,
				date: row.date,
				weekLabel: row.week_label || undefined,
				amount: Number(row.amount),
				recipient: row.recipient || undefined,
				note: row.note || undefined,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			}
		})
	},
}
