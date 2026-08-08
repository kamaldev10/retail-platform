import { StateCreator } from 'zustand'
import { PRODUCTS } from '../../lib/calculations'
import { CatalogSliceState, CatalogSliceActions, GasolineStore } from '../types'

export type CatalogSlice = CatalogSliceState & CatalogSliceActions

export const createCatalogSlice: StateCreator<GasolineStore, [], [], CatalogSlice> = (
	set,
	get,
) => ({
	products: PRODUCTS,
	jerigenStock: 0,
	bottleStock: {
		p1: 0,
		p2: 0,
		p3: 0,
	},

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

	updateJerigenStock: async jerigen => {
		const previous = get().jerigenStock
		const bottles = get().bottleStock

		set({
			jerigenStock: jerigen,
			syncStatus: 'syncing',
			syncMessage: 'Menyimpan stok jerigen...',
		})

		try {
			const response = await fetch('/api/stock', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jerigen, bottles }),
			})
			if (!response.ok) {
				const data = await response.json().catch(() => ({}))
				const errorMsg =
					(data as { error?: string }).error ||
					`Gagal menyimpan stok jerigen (${response.status})`
				set({ jerigenStock: previous, syncStatus: 'error', syncMessage: errorMsg })
				return { success: false, message: errorMsg }
			}
			set({ syncStatus: 'idle', syncMessage: '' })
			return { success: true }
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungi server'
			set({ jerigenStock: previous, syncStatus: 'error', syncMessage: errorMsg })
			return { success: false, message: errorMsg }
		}
	},

	fetchStockFromCloud: async () => {
		set({ syncStatus: 'fetching', syncMessage: 'Mengambil data stok dari database...' })
		try {
			const response = await fetch('/api/stock')
			if (!response.ok) {
				set({ syncStatus: 'error', syncMessage: `Gagal mengambil stok: Error ${response.status}` })
				return { success: false, message: `Error status ${response.status}` }
			}
			const data = await response.json()
			const { jerigen, bottles } = data as { jerigen: number; bottles: Record<string, number> }

			set({
				jerigenStock: jerigen,
				bottleStock: bottles,
				syncStatus: 'idle',
				syncMessage: '',
			})
			return { success: true }
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Network error'
			set({ syncStatus: 'error', syncMessage: errorMsg })
			return { success: false, message: errorMsg }
		}
	},
})
