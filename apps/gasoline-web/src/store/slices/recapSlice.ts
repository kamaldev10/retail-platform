import { StateCreator } from 'zustand'
import { DailyRecapResult } from '../../lib/calculations'
import { RecapSliceState, RecapSliceActions, GasolineStore } from '../types'

export type RecapSlice = RecapSliceState & RecapSliceActions

export const createRecapSlice: StateCreator<GasolineStore, [], [], RecapSlice> = (set, get) => ({
	dailyRecaps: [],
	recapPagination: {
		page: 1,
		limit: 20,
		totalItems: 0,
		totalPages: 1,
		hasNextPage: false,
		hasPrevPage: false,
	},

	fetchRecapsFromCloud: async (page = 1, limit = 20) => {
		set({ syncStatus: 'fetching', syncMessage: 'Mengambil riwayat rekap harian dari database...' })
		try {
			const response = await fetch(`/api/recap?page=${page}&limit=${limit}`)
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
			const result = await response.json()
			const cloudRecaps: DailyRecapResult[] = Array.isArray(result) ? result : result.data || []
			const pagination = result.pagination || {
				page,
				limit,
				totalItems: cloudRecaps.length,
				totalPages: 1,
				hasNextPage: false,
				hasPrevPage: false,
			}

			const sorted = [...cloudRecaps].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			)

			const updates: Partial<GasolineStore> = {
				dailyRecaps: sorted,
				recapPagination: pagination,
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

			await get().fetchRecapsFromCloud(get().recapPagination.page, get().recapPagination.limit)
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

			await get().fetchRecapsFromCloud(get().recapPagination.page, get().recapPagination.limit)
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
