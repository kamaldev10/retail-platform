import { StateCreator } from 'zustand'
import { SalarySliceState, SalarySliceActions, GasolineStore, SalaryPaymentItem } from '../types'

export type SalarySlice = SalarySliceState & SalarySliceActions

export const createSalarySlice: StateCreator<GasolineStore, [], [], SalarySlice> = (set) => ({
	salaryPayments: [],

	addSalaryPayment: async salaryData => {
		try {
			const response = await fetch('/api/salary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(salaryData),
			})

			if (!response.ok) {
				const data = await response.json().catch(() => ({}))
				return { success: false, message: data.error || `Status ${response.status}` }
			}

			const newSalary = await response.json()
			set(state => ({
				salaryPayments: [newSalary, ...state.salaryPayments],
			}))

			return { success: true }
		} catch (err) {
			return {
				success: false,
				message: err instanceof Error ? err.message : 'Gagal menghubungi server',
			}
		}
	},

	fetchSalaryFromCloud: async () => {
		try {
			const response = await fetch('/api/salary')
			if (!response.ok) {
				return { success: false, message: `Status ${response.status}` }
			}
			const cloudSalaries: SalaryPaymentItem[] = await response.json()

			const sorted = [...cloudSalaries].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			)

			set({ salaryPayments: sorted })
			return { success: true }
		} catch (err) {
			return {
				success: false,
				message: err instanceof Error ? err.message : 'Network error',
			}
		}
	},
})
