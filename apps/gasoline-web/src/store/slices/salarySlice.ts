import { StateCreator } from 'zustand'
import { SalarySliceState, SalarySliceActions, GasolineStore, SalaryPaymentItem } from '../types'

export type SalarySlice = SalarySliceState & SalarySliceActions

export const createSalarySlice: StateCreator<GasolineStore, [], [], SalarySlice> = set => ({
	salaryPayments: [],

	addSalaryPayment: async salaryData => {
		set({ syncStatus: 'syncing', syncMessage: 'Menyimpan data gaji ke database...' })
		try {
			const response = await fetch('/api/salary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(salaryData),
			})

			if (!response.ok) {
				const data = await response.json().catch(() => ({}))
				const errorMsg = data.error || `Status ${response.status}`
				set({ syncStatus: 'error', syncMessage: errorMsg })
				return { success: false, message: errorMsg }
			}

			const newSalary = await response.json()
			set(state => ({
				salaryPayments: [newSalary, ...state.salaryPayments],
				syncStatus: 'idle',
				syncMessage: '',
			}))

			return { success: true }
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungi server'
			set({ syncStatus: 'error', syncMessage: errorMsg })
			return {
				success: false,
				message: errorMsg,
			}
		}
	},

	fetchSalaryFromCloud: async () => {
		set({ syncStatus: 'fetching', syncMessage: 'Mengambil data gaji dari database...' })
		try {
			const response = await fetch('/api/salary')
			if (!response.ok) {
				set({
					syncStatus: 'error',
					syncMessage: `Gagal mengambil data gaji: Status ${response.status}`,
				})
				return { success: false, message: `Status ${response.status}` }
			}
			const cloudSalaries: SalaryPaymentItem[] = await response.json()

			const sorted = [...cloudSalaries].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			)

			set({
				salaryPayments: sorted,
				syncStatus: 'idle',
				syncMessage: '',
			})
			return { success: true }
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Network error'
			set({ syncStatus: 'error', syncMessage: errorMsg })
			return {
				success: false,
				message: errorMsg,
			}
		}
	},
})
