import { StateCreator } from 'zustand'
import {
	FinanceSliceState,
	FinanceSliceActions,
	GasolineStoreState,
	GasolineStoreActions,
} from '../types'

export type FinanceSlice = FinanceSliceState & FinanceSliceActions

export const createFinanceSlice: StateCreator<
	GasolineStoreState & GasolineStoreActions,
	[],
	[],
	FinanceSlice
> = (set, get) => ({
	financeEntries: [],
	financeSummary: {
		totalInflow: 0,
		totalOutflow: 0,
		netCashflow: 0,
		categoryBreakdown: {},
	},
	financePagination: {
		page: 1,
		limit: 20,
		totalItems: 0,
		totalPages: 1,
		hasNextPage: false,
		hasPrevPage: false,
	},

	fetchFinancesFromCloud: async filters => {
		const setSyncStatus = get().setSyncStatus
		setSyncStatus('fetching', 'Memuat data buku kas keuangan...')

		try {
			const queryParams = new URLSearchParams()
			if (filters?.page) queryParams.set('page', String(filters.page))
			if (filters?.limit) queryParams.set('limit', String(filters.limit))
			if (filters?.startDate) queryParams.set('startDate', filters.startDate)
			if (filters?.endDate) queryParams.set('endDate', filters.endDate)
			if (filters?.category) queryParams.set('category', filters.category)
			if (filters?.flowType) queryParams.set('flowType', filters.flowType)

			const response = await fetch(`/api/finance?${queryParams.toString()}`)

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				setSyncStatus(
					'error',
					`Gagal memuat keuangan: ${errorData.details || errorData.error || response.statusText}`,
				)
				return { success: false, message: errorData.details || errorData.error }
			}

			const data = await response.json()
			set({
				financeEntries: data.entries || [],
				financeSummary: data.summary || {
					totalInflow: 0,
					totalOutflow: 0,
					netCashflow: 0,
					categoryBreakdown: {},
				},
				financePagination: data.pagination || {
					page: 1,
					limit: 20,
					totalItems: 0,
					totalPages: 1,
					hasNextPage: false,
					hasPrevPage: false,
				},
			})

			setSyncStatus('idle')
			return { success: true }
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Kesalahan jaringan'
			setSyncStatus('error', `Gagal memuat keuangan: ${msg}`)
			return { success: false, message: msg }
		}
	},

	addFinanceEntry: async entry => {
		const setSyncStatus = get().setSyncStatus
		setSyncStatus('syncing', 'Menyimpan transaksi keuangan...')

		try {
			const response = await fetch('/api/finance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(entry),
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				setSyncStatus(
					'error',
					`Gagal menyimpan: ${errorData.details || errorData.error || response.statusText}`,
				)
				return { success: false, message: errorData.details || errorData.error }
			}

			const newEntry = await response.json()

			set(state => ({
				financeEntries: [newEntry, ...state.financeEntries],
			}))

			get().fetchFinancesFromCloud()

			setSyncStatus('idle')
			return { success: true }
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Kesalahan jaringan'
			setSyncStatus('error', `Gagal menyimpan transaksi: ${msg}`)
			return { success: false, message: msg }
		}
	},
})
