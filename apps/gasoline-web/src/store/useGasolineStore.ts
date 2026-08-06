import { create } from 'zustand'
import {
	DailyRecapResult,
	calculateDailyRecap,
	DailyRecapInput,
	ProductDefinition,
	PRODUCTS,
} from '../lib/calculations'

export interface SalaryPaymentItem {
	id: string
	date: string
	weekLabel?: string
	amount: number
	recipient?: string
	note?: string
	createdAt?: string
}

interface GasolineStore {
	// Dynamic Product Catalog (CRUD)
	products: ProductDefinition[]

	// Storage Tank (in Liters, max 50L)
	jerigenStock: number

	// Ready bottle stock on shelf
	bottleStock: Record<string, number>

	// Current active opname shift state
	activeDate: string
	activeOpeningStock: Record<string, number> | null
	activePushedBottles: Record<string, number>
	activeCashIn: number
	activeCashOut: number

	// Historic data (Single Source of Truth from PostgreSQL)
	dailyRecaps: DailyRecapResult[]
	salaryPayments: SalaryPaymentItem[]

	// Methods
	setOpeningStock: (date: string, stocks: Record<string, number>, uangAwal: number) => void

	submitPurchase: (
		liters: number,
		cost: number,
		target: string,
	) => { success: boolean; message?: string }

	pourFuelToBottles: (bottleId: string, quantity: number) => { success: boolean; message?: string }

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

	// Salary Payments Methods
	addSalaryPayment: (salary: {
		date: string
		weekLabel?: string
		amount: number
		recipient?: string
		note?: string
	}) => Promise<{ success: boolean; message?: string }>
	fetchSalaryFromCloud: () => Promise<{ success: boolean; message?: string }>

	// CRUD Products Catalog Methods
	addProduct: (product: ProductDefinition) => {
		success: boolean
		message?: string
	}

	updateProduct: (
		id: string,
		updated: Omit<ProductDefinition, 'id'>,
	) => { success: boolean; message?: string }
	deleteProduct: (id: string) => { success: boolean; message?: string }
	fetchRecapsFromCloud: () => Promise<{ success: boolean; message?: string }>

	// CRUD Live Stock Methods (Direct Adjustment)
	updateStocksDirectly: (jerigen: number, bottles: Record<string, number>) => void

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

export const useGasolineStore = create<GasolineStore>()((set, get) => ({
	products: PRODUCTS,
	jerigenStock: 0,
	bottleStock: {
		p1: 0,
		p2: 0,
		p3: 0,
	},
	activeDate: '',
	activeOpeningStock: null,
	activePushedBottles: {
		p1: 0,
		p2: 0,
		p3: 0,
	},
	activeCashIn: 0,
	activeCashOut: 0,
	dailyRecaps: [],
	salaryPayments: [],

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

	// CRUD Catalog Methods
	addProduct: product => {
		const state = get()
		if (
			state.products.some(
				p => p.id === product.id || p.name.toLowerCase() === product.name.toLowerCase(),
			)
		) {
			return {
				success: false,
				message: 'Produk dengan ID atau nama ini sudah ada.',
			}
		}
		set({
			products: [...state.products, product],
			bottleStock: { ...state.bottleStock, [product.id]: 0 },
		})
		return { success: true }
	},

	updateProduct: (id, updated) => {
		const state = get()
		if (!state.products.some(p => p.id === id)) {
			return { success: false, message: 'Produk tidak ditemukan.' }
		}
		set({
			products: state.products.map(p => (p.id === id ? { ...p, ...updated } : p)),
		})
		return { success: true }
	},

	deleteProduct: id => {
		const state = get()
		if (!state.products.some(p => p.id === id)) {
			return { success: false, message: 'Produk tidak ditemukan.' }
		}
		const updatedBottleStock = { ...state.bottleStock }
		delete updatedBottleStock[id]

		set({
			products: state.products.filter(p => p.id !== id),
			bottleStock: updatedBottleStock,
		})
		return { success: true }
	},

	// CRUD Live Stock Methods
	updateStocksDirectly: (jerigen, bottles) => {
		set({
			jerigenStock: jerigen,
			bottleStock: bottles,
		})
	},

	fetchRecapsFromCloud: async () => {
		try {
			const response = await fetch('/api/recap')
			if (!response.ok) {
				return {
					success: false,
					message: `Error status ${response.status}`,
				}
			}
			const cloudRecaps: DailyRecapResult[] = await response.json()

			// Sort recaps descending by date
			const sorted = [...cloudRecaps].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			)

			const updates: Partial<GasolineStore> = { dailyRecaps: sorted }

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
			return {
				success: false,
				message: err instanceof Error ? err.message : 'Network error',
			}
		}
	},

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

		try {
			const response = await fetch('/api/recap/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recaps: [updatedRecap] }),
			})

			if (!response.ok) {
				const data = await response.json().catch(() => ({}))
				return { success: false, message: data.error || `Gagal update di server (${response.status})` }
			}

			await get().fetchRecapsFromCloud()
			return { success: true }
		} catch (err) {
			return {
				success: false,
				message: err instanceof Error ? err.message : 'Gagal menghubungi server',
			}
		}
	},

	deleteRecap: async date => {
		try {
			const response = await fetch(`/api/recap?date=${encodeURIComponent(date)}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				const data = await response.json().catch(() => ({}))
				return {
					success: false,
					message: data.error || `Gagal menghapus di server (status ${response.status})`,
				}
			}

			await get().fetchRecapsFromCloud()
			return { success: true, message: `Rekap ${date} berhasil dihapus` }
		} catch (err) {
			return {
				success: false,
				message: err instanceof Error ? err.message : 'Gagal menghubungi server',
			}
		}
	},
}))
