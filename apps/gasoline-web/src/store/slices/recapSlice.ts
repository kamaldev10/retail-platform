import { StateCreator } from 'zustand'
import { DailyRecapResult } from '../../lib/calculations'
import { RecapSliceState, RecapSliceActions, GasolineStore } from '../types'

export type RecapSlice = RecapSliceState & RecapSliceActions

export const createRecapSlice: StateCreator<GasolineStore, [], [], RecapSlice> = (set, get) => ({
	dailyRecaps: [],

	fetchRecapsFromCloud: async () => {
		set({ syncStatus: 'fetching', syncMessage: 'Mengambil riwayat rekap harian dari database...' })
		try {
			const response = await fetch('/api/recap')
			if (!response.ok) {
				set({
					syncStatus: 'error',
					syncMessage: `Gagal mengambil rekap: Status ${response.status}`,
				})
				return {
					success: false,
					message: `Error status ${response.status}`,
				}
			}
			const cloudRecaps: DailyRecapResult[] = await response.json()

			const sorted = [...cloudRecaps].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			)

			const updates: Partial<GasolineStore> = {
				dailyRecaps: sorted,
				syncStatus: 'idle',
				syncMessage: '',
			}

			if (sorted.length > 0) {
				const latest = sorted[0]
				const nextBottleStock = { ...get().bottleStock }
				latest.items.forEach(item => {
					nextBottleStock[item.productId] = item.closingStock
				})
				updates.bottleStock = nextBottleStock
			}

			set(updates)
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

	updateRecap: async (date, updatedData) => {
		const state = get()
		const targetRecap = state.dailyRecaps.find(r => r.date === date)
		if (!targetRecap) {
			return { success: false, message: 'Data rekap tidak ditemukan' }
		}

		const newCashIn = updatedData.cashIn ?? targetRecap.cashSummary.cashIn
		const newCashOut = updatedData.cashOut ?? targetRecap.cashSummary.cashOut
		const newUangAwal = updatedData.uangAwal ?? targetRecap.uangAwal
		const newBelanja = updatedData.belanja ?? targetRecap.belanja
		const newNote = updatedData.note !== undefined ? updatedData.note : targetRecap.note

		const updatedRecap: DailyRecapResult = {
			...targetRecap,
			cashSummary: {
				cashIn: newCashIn,
				cashOut: newCashOut,
				netFinanceFlow: newCashIn - newCashOut,
			},
			uangAwal: newUangAwal,
			belanja: newBelanja,
			note: newNote,
		}

		set({ syncStatus: 'syncing', syncMessage: 'Memperbarui data rekap di database...' })
		try {
			const response = await fetch('/api/recap/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recaps: [updatedRecap] }),
			})

			if (!response.ok) {
				const data = await response.json().catch(() => ({}))
				const errorMsg = data.error || `Gagal update di server (${response.status})`
				set({ syncStatus: 'error', syncMessage: errorMsg })
				return {
					success: false,
					message: errorMsg,
				}
			}

			await get().fetchRecapsFromCloud()
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

	deleteRecap: async date => {
		set({ syncStatus: 'syncing', syncMessage: `Menghapus rekap tanggal ${date} dari database...` })
		try {
			const response = await fetch(`/api/recap?date=${encodeURIComponent(date)}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				const data = await response.json().catch(() => ({}))
				const errorMsg = data.error || `Gagal menghapus di server (status ${response.status})`
				set({ syncStatus: 'error', syncMessage: errorMsg })
				return {
					success: false,
					message: errorMsg,
				}
			}

			await get().fetchRecapsFromCloud()
			return { success: true, message: `Rekap ${date} berhasil dihapus` }
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungi server'
			set({ syncStatus: 'error', syncMessage: errorMsg })
			return {
				success: false,
				message: errorMsg,
			}
		}
	},
})
