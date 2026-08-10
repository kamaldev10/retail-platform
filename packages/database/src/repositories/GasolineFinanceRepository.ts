import { query } from '../connection'
import { PaginationMeta, PaginatedResult } from '@retail/types'

export type { PaginationMeta, PaginatedResult }

export interface GasolineFinanceRow {
	id: string
	transactionDate: string
	flowType: 'IN' | 'OUT'
	category:
		| 'SALES_REVENUE'
		| 'FUEL_PURCHASE'
		| 'SALARY_PAYMENT'
		| 'INITIAL_CASH'
		| 'CAPITAL_INJECTION'
		| 'OWNER_WITHDRAWAL'
		| 'OTHER'
	amount: number
	paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS'
	referenceType?: 'RECAP' | 'SALARY' | 'SHIFT_TRANSACTION' | 'MANUAL'
	referenceId?: string
	recapId?: string
	salaryId?: string
	shiftTransactionId?: string
	status: 'COMPLETED' | 'PENDING' | 'CANCELLED'
	createdBy?: string
	updatedBy?: string
	description?: string
	createdAt?: string
	updatedAt?: string
}

export interface CreateFinanceEntryInput {
	transactionDate?: string
	flowType: 'IN' | 'OUT'
	category:
		| 'SALES_REVENUE'
		| 'FUEL_PURCHASE'
		| 'SALARY_PAYMENT'
		| 'INITIAL_CASH'
		| 'CAPITAL_INJECTION'
		| 'OWNER_WITHDRAWAL'
		| 'OTHER'
	amount: number
	paymentMethod?: 'CASH' | 'TRANSFER' | 'QRIS'
	referenceType?: 'RECAP' | 'SALARY' | 'SHIFT_TRANSACTION' | 'MANUAL'
	referenceId?: string
	recapId?: string
	salaryId?: string
	shiftTransactionId?: string
	status?: 'COMPLETED' | 'PENDING' | 'CANCELLED'
	createdBy?: string
	updatedBy?: string
	description?: string
}

export interface FinanceSummary {
	totalInflow: number
	totalOutflow: number
	netCashflow: number
	categoryBreakdown: Record<string, number>
}

export const gasolineFinanceRepository = {
	async findAllFinances(filters?: {
		page?: number
		limit?: number
		startDate?: string
		endDate?: string
		category?: string
		flowType?: 'IN' | 'OUT'
	}): Promise<PaginatedResult<GasolineFinanceRow>> {
		const validPage = Math.max(1, filters?.page || 1)
		const validLimit = Math.min(100, Math.max(1, filters?.limit || 20))
		const offset = (validPage - 1) * validLimit

		const conditions: string[] = []
		const params: any[] = []

		if (filters?.startDate) {
			params.push(filters.startDate)
			conditions.push(`transaction_date >= $${params.length}`)
		}

		if (filters?.endDate) {
			params.push(filters.endDate)
			conditions.push(`transaction_date <= $${params.length}`)
		}

		if (filters?.category) {
			params.push(filters.category)
			conditions.push(`category = $${params.length}`)
		}

		if (filters?.flowType) {
			params.push(filters.flowType)
			conditions.push(`flow_type = $${params.length}`)
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

		const countRes = await query(`SELECT COUNT(*) FROM gasoline.finances ${whereClause}`, params)
		const totalItems = Number(countRes.rows[0]?.count || 0)

		const dataParams = [...params, validLimit, offset]
		const limitParamIdx = params.length + 1
		const offsetParamIdx = params.length + 2

		const res = await query(
			`SELECT id, transaction_date::text, flow_type, category, amount, payment_method,
              reference_type, reference_id, recap_id, salary_id, shift_transaction_id,
              status, created_by, updated_by, description, created_at, updated_at
       FROM gasoline.finances
       ${whereClause}
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
			dataParams,
		)

		const totalPages = Math.ceil(totalItems / validLimit) || 1

		return {
			data: res.rows.map((r: any) => ({
				id: r.id,
				transactionDate: r.transaction_date,
				flowType: r.flow_type,
				category: r.category,
				amount: Number(r.amount),
				paymentMethod: r.payment_method,
				referenceType: r.reference_type || undefined,
				referenceId: r.reference_id || undefined,
				recapId: r.recap_id || undefined,
				salaryId: r.salary_id || undefined,
				shiftTransactionId: r.shift_transaction_id || undefined,
				status: r.status,
				createdBy: r.created_by || undefined,
				updatedBy: r.updated_by || undefined,
				description: r.description || undefined,
				createdAt: r.created_at,
				updatedAt: r.updated_at,
			})),
			pagination: {
				page: validPage,
				limit: validLimit,
				totalItems,
				totalPages,
				hasNextPage: validPage < totalPages,
				hasPrevPage: validPage > 1,
			},
		}
	},

	async createEntry(input: CreateFinanceEntryInput): Promise<GasolineFinanceRow> {
		const res = await query(
			`INSERT INTO gasoline.finances (
        transaction_date, flow_type, category, amount, payment_method,
        reference_type, reference_id, recap_id, salary_id, shift_transaction_id,
        status, created_by, updated_by, description
       ) VALUES (
        COALESCE($1::date, CURRENT_DATE), $2, $3, $4, COALESCE($5, 'CASH'),
        $6, $7, $8, $9, $10,
        COALESCE($11, 'COMPLETED'), $12, $13, $14
       ) RETURNING id, transaction_date::text, flow_type, category, amount, payment_method,
                   reference_type, reference_id, recap_id, salary_id, shift_transaction_id,
                   status, created_by, updated_by, description, created_at, updated_at`,
			[
				input.transactionDate || null,
				input.flowType,
				input.category,
				input.amount,
				input.paymentMethod || 'CASH',
				input.referenceType || 'MANUAL',
				input.referenceId || null,
				input.recapId || null,
				input.salaryId || null,
				input.shiftTransactionId || null,
				input.status || 'COMPLETED',
				input.createdBy || null,
				input.updatedBy || null,
				input.description || null,
			],
		)

		const r = res.rows[0]
		return {
			id: r.id,
			transactionDate: r.transaction_date,
			flowType: r.flow_type,
			category: r.category,
			amount: Number(r.amount),
			paymentMethod: r.payment_method,
			referenceType: r.reference_type || undefined,
			referenceId: r.reference_id || undefined,
			recapId: r.recap_id || undefined,
			salaryId: r.salary_id || undefined,
			shiftTransactionId: r.shift_transaction_id || undefined,
			status: r.status,
			createdBy: r.created_by || undefined,
			updatedBy: r.updated_by || undefined,
			description: r.description || undefined,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		}
	},

	async getSummary(startDate?: string, endDate?: string): Promise<FinanceSummary> {
		const conditions: string[] = []
		const params: any[] = []

		if (startDate) {
			params.push(startDate)
			conditions.push(`transaction_date >= $${params.length}`)
		}

		if (endDate) {
			params.push(endDate)
			conditions.push(`transaction_date <= $${params.length}`)
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

		const res = await query(
			`SELECT flow_type, category, SUM(amount) as total
       FROM gasoline.finances
       ${whereClause}
       GROUP BY flow_type, category`,
			params,
		)

		let totalInflow = 0
		let totalOutflow = 0
		const categoryBreakdown: Record<string, number> = {}

		for (const r of res.rows) {
			const amt = Number(r.total)
			categoryBreakdown[r.category] = amt
			if (r.flow_type === 'IN') {
				totalInflow += amt
			} else {
				totalOutflow += amt
			}
		}

		return {
			totalInflow,
			totalOutflow,
			netCashflow: totalInflow - totalOutflow,
			categoryBreakdown,
		}
	},
}
