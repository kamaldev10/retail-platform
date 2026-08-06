import { DailyRecapResult, ProductDefinition } from '../lib/calculations'

export interface ShiftTransactionItem {
	id?: string
	shift_date: string
	transaction_date: string
	type: 'purchase' | 'pour'
	product_id?: string
	liters?: number
	quantity?: number
	cost: number
	note?: string
}

export interface SalaryPaymentItem {
	id: string
	date: string
	weekLabel?: string
	amount: number
	recipient?: string
	note?: string
	createdAt?: string
}

export interface CatalogSliceState {
	products: ProductDefinition[]
	jerigenStock: number
	bottleStock: Record<string, number>
}

export interface CatalogSliceActions {
	addProduct: (product: ProductDefinition) => { success: boolean; message?: string }
	updateProduct: (
		id: string,
		updated: Omit<ProductDefinition, 'id'>,
	) => { success: boolean; message?: string }
	deleteProduct: (id: string) => { success: boolean; message?: string }
	updateStocksDirectly: (
		jerigen: number,
		bottles: Record<string, number>,
	) => Promise<{ success: boolean; message?: string }>
	fetchStockFromCloud: () => Promise<{ success: boolean; message?: string }>
}

export interface ShiftSliceState {
	activeDate: string
	activeOpeningStock: Record<string, number> | null
	activePushedBottles: Record<string, number>
	activeCashIn: number
	activeCashOut: number
	shiftTransactions: ShiftTransactionItem[]
}

export interface ShiftSliceActions {
	setOpeningStock: (date: string, stocks: Record<string, number>, uangAwal: number) => Promise<void>
	submitPurchase: (
		liters: number,
		cost: number,
		target: string,
		transactionDate?: string,
	) => { success: boolean; message?: string }
	pourFuelToBottles: (
		bottleId: string,
		quantity: number,
		transactionDate?: string,
	) => { success: boolean; message?: string }
	submitClosingStock: (
		closingStocks: Record<string, number>,
		uangAkhir: number,
		note?: string,
	) => Promise<{ success: boolean; message?: string }>
	submitDailyReport: (
		date: string,
		uangAwal: number,
		uangAkhir: number,
		openingStocks: Record<string, number>,
		closingStocks: Record<string, number>,
		note?: string,
	) => Promise<{ success: boolean; message?: string }>
	clearAllRecaps: () => void
	fetchActiveShift: () => Promise<{ success: boolean; message?: string }>
	clearActiveShift: () => Promise<void>
	fetchShiftTransactions: (shiftDate: string) => Promise<{ success: boolean; message?: string }>
}

export interface RecapSliceState {
	dailyRecaps: DailyRecapResult[]
}

export interface RecapSliceActions {
	fetchRecapsFromCloud: () => Promise<{ success: boolean; message?: string }>
	updateRecap: (
		date: string,
		updatedData: {
			cashIn?: number
			cashOut?: number
			uangAwal?: number
			belanja?: number
			note?: string
		},
	) => Promise<{ success: boolean; message?: string }>
	deleteRecap: (date: string) => Promise<{ success: boolean; message?: string }>
}

export interface SalarySliceState {
	salaryPayments: SalaryPaymentItem[]
}

export interface SalarySliceActions {
	addSalaryPayment: (salary: {
		date: string
		weekLabel?: string
		amount: number
		recipient?: string
		note?: string
	}) => Promise<{ success: boolean; message?: string }>
	fetchSalaryFromCloud: () => Promise<{ success: boolean; message?: string }>
}

export type GasolineStoreState = CatalogSliceState &
	ShiftSliceState &
	RecapSliceState &
	SalarySliceState
export type GasolineStoreActions = CatalogSliceActions &
	ShiftSliceActions &
	RecapSliceActions &
	SalarySliceActions
export type GasolineStore = GasolineStoreState & GasolineStoreActions
