import { StateCreator } from 'zustand'
import { DailyRecapInput, PRODUCTS, calculateDailyRecap } from '../../lib/calculations'
import { ShiftSliceState, ShiftSliceActions, GasolineStore } from '../types'

export type ShiftSlice = ShiftSliceState & ShiftSliceActions

export const createShiftSlice: StateCreator<GasolineStore, [], [], ShiftSlice> = (set, get) => ({
	activeDate: '',
	activeOpeningStock: null,
	activePushedBottles: {
		p1: 0,
		p2: 0,
		p3: 0,
	},
	activeCashIn: 0,
	activeCashOut: 0,

	setOpeningStock: (date, stocks, uangAwal) =>
		set({
			activeDate: date,
			activeOpeningStock: stocks,
			bottleStock: { ...stocks },
			activePushedBottles: Object.keys(stocks).reduce(
				(acc, key) => {
					acc[key] = 0
					return acc
				},
				{} as Record<string, number>,
			),
			activeCashIn: uangAwal,
			activeCashOut: 0,
		}),

	submitPurchase: (liters, cost, target) => {
		const state = get()

		if (target === 'jerigen') {
			const newStock = state.jerigenStock + liters
			if (newStock > 50) {
				return {
					success: false,
					message: `Gagal: Kapasitas Jerigen tidak boleh melebihi 50L (Maks sisa kapasitas: ${(50 - state.jerigenStock).toFixed(1)}L)`,
				}
			}
			set({
				jerigenStock: newStock,
				activeCashOut: state.activeCashOut + cost,
			})
			return { success: true }
		} else {
			const product = state.products.find(p => p.id === target)
			if (!product) return { success: false, message: 'Produk tidak valid' }

			const newUnits = liters / product.volume
			const updatedPushed = { ...state.activePushedBottles }
			updatedPushed[target] = (updatedPushed[target] || 0) + newUnits

			set({
				bottleStock: {
					...state.bottleStock,
					[target]: (state.bottleStock[target] || 0) + newUnits,
				},
				activePushedBottles: updatedPushed,
				activeCashOut: state.activeCashOut + cost,
			})
			return { success: true }
		}
	},

	pourFuelToBottles: (bottleId, quantity) => {
		const state = get()
		const product = state.products.find(p => p.id === bottleId)
		if (!product) return { success: false, message: 'Produk tidak valid' }

		const requiredLiters = quantity * product.volume
		if (state.jerigenStock < requiredLiters) {
			return {
				success: false,
				message: `Gagal: Stok jerigen tidak mencukupi (Butuh: ${requiredLiters}L, Tersedia: ${state.jerigenStock.toFixed(1)}L)`,
			}
		}

		const updatedPushed = { ...state.activePushedBottles }
		updatedPushed[bottleId] = (updatedPushed[bottleId] || 0) + quantity

		set({
			jerigenStock: state.jerigenStock - requiredLiters,
			bottleStock: {
				...state.bottleStock,
				[bottleId]: (state.bottleStock[bottleId] || 0) + quantity,
			},
			activePushedBottles: updatedPushed,
		})

		return { success: true }
	},

	submitClosingStock: async (closingStocks, uangAkhir, note) => {
		const state = get()
		if (!state.activeOpeningStock) return { success: false, message: 'Shift belum dibuka' }

		const recapInputs: DailyRecapInput[] = state.products.map(p => {
			const opening = state.activeOpeningStock![p.id] || 0
			const poured = state.activePushedBottles[p.id] || 0
			const closing = closingStocks[p.id] || 0
			const openingTotal = opening + poured

			return {
				productId: p.id,
				openingStock: openingTotal,
				closingStock: closing,
			}
		})

		const id = `recap-${Date.now()}`
		const newRecap = {
			...calculateDailyRecap(
				id,
				state.activeDate,
				recapInputs,
				uangAkhir,
				state.activeCashIn + state.activeCashOut,
				state.products,
			),
			uangAwal: state.activeCashIn,
			belanja: state.activeCashOut,
			note: note || '',
		}

		try {
			const response = await fetch('/api/recap/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recaps: [newRecap] }),
			})

			if (!response.ok) {
				const data = await response.json().catch(() => ({}))
				return { success: false, message: data.error || `Gagal menyimpan ke server (${response.status})` }
			}

			const nextBottleStock = { ...state.bottleStock }
			state.products.forEach(p => {
				if (p.id in closingStocks) {
					nextBottleStock[p.id] = closingStocks[p.id]
				}
			})

			const filteredRecaps = state.dailyRecaps.filter(r => r.date !== state.activeDate)

			set({
				dailyRecaps: [newRecap, ...filteredRecaps],
				bottleStock: nextBottleStock,
				activeOpeningStock: null,
				activePushedBottles: state.products.reduce(
					(acc, p) => {
						acc[p.id] = 0
						return acc
					},
					{} as Record<string, number>,
				),
				activeCashIn: 0,
				activeCashOut: 0,
			})

			await get().fetchRecapsFromCloud()
			return { success: true }
		} catch (err) {
			return {
				success: false,
				message: err instanceof Error ? err.message : 'Gagal menghubungi server',
			}
		}
	},

	submitDailyReport: async (date, uangAwal, uangAkhir, openingStocks, closingStocks, note) => {
		const state = get()

		const recapInputs: DailyRecapInput[] = state.products.map(p => {
			const opening = openingStocks[p.id] || 0
			const closing = closingStocks[p.id] || 0

			return {
				productId: p.id,
				openingStock: opening,
				closingStock: closing,
			}
		})

		const id = `recap-${Date.now()}`
		const newRecap = {
			...calculateDailyRecap(
				id,
				date,
				recapInputs,
				uangAkhir,
				uangAwal,
				state.products,
			),
			uangAwal: uangAwal,
			belanja: 0,
			note: note || '',
		}

		try {
			const response = await fetch('/api/recap/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recaps: [newRecap] }),
			})

			if (!response.ok) {
				const data = await response.json().catch(() => ({}))
				return { success: false, message: data.error || `Gagal menyimpan ke server (${response.status})` }
			}

			const nextBottleStock = { ...state.bottleStock }
			state.products.forEach(p => {
				if (p.id in closingStocks) {
					nextBottleStock[p.id] = closingStocks[p.id]
				}
			})

			const filteredRecaps = state.dailyRecaps.filter(r => r.date !== date)

			set({
				dailyRecaps: [newRecap, ...filteredRecaps],
				bottleStock: nextBottleStock,
				activeOpeningStock: null,
				activePushedBottles: state.products.reduce(
					(acc, p) => {
						acc[p.id] = 0
						return acc
					},
					{} as Record<string, number>,
				),
				activeCashIn: 0,
				activeCashOut: 0,
			})

			await get().fetchRecapsFromCloud()
			return { success: true }
		} catch (err) {
			return {
				success: false,
				message: err instanceof Error ? err.message : 'Gagal menghubungi server',
			}
		}
	},

	clearAllRecaps: () =>
		set({
			dailyRecaps: [],
			products: PRODUCTS,
			jerigenStock: 0,
			bottleStock: { p1: 0, p2: 0, p3: 0 },
			activeOpeningStock: null,
			activePushedBottles: { p1: 0, p2: 0, p3: 0 },
			activeCashIn: 0,
			activeCashOut: 0,
		}),
})
