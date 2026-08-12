import { StateCreator } from 'zustand'
import { PRODUCTS, ProductDefinition } from '../../lib/calculations'
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

	fetchProductsFromCloud: async () => {
		try {
			const res = await fetch('/api/products')
			if (!res.ok) return { success: false, message: `Error ${res.status}` }
			const data = await res.json()
			if (Array.isArray(data) && data.length > 0) {
				set({ products: data })
			}
			return { success: true }
		} catch (err) {
			return { success: false, message: err instanceof Error ? err.message : 'Network error' }
		}
	},

	addProduct: async product => {
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

		set({ syncStatus: 'syncing', syncMessage: 'Menyimpan produk ke database...' })

		try {
			const res = await fetch('/api/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(product),
			})

			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				const msg = data.error || 'Gagal menyimpan produk'
				set({ syncStatus: 'error', syncMessage: msg })
				return { success: false, message: msg }
			}

			set({
				products: [...state.products, product],
				bottleStock: { ...state.bottleStock, [product.id]: 0 },
				syncStatus: 'idle',
				syncMessage: '',
			})
			return { success: true }
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Gagal menghubungi server'
			set({ syncStatus: 'error', syncMessage: msg })
			return { success: false, message: msg }
		}
	},

	updateProduct: async (id, updated) => {
		const state = get()
		const existing = state.products.find(p => p.id === id)
		if (!existing) {
			return { success: false, message: 'Produk tidak ditemukan.' }
		}

		const fullProduct: ProductDefinition = {
			...existing,
			...updated,
		}

		set({ syncStatus: 'syncing', syncMessage: 'Memperbarui produk di database...' })

		try {
			const res = await fetch('/api/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(fullProduct),
			})

			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				const msg = data.error || 'Gagal memperbarui produk'
				set({ syncStatus: 'error', syncMessage: msg })
				return { success: false, message: msg }
			}

			set({
				products: state.products.map(p => (p.id === id ? fullProduct : p)),
				syncStatus: 'idle',
				syncMessage: '',
			})
			return { success: true }
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Gagal menghubungi server'
			set({ syncStatus: 'error', syncMessage: msg })
			return { success: false, message: msg }
		}
	},

	deleteProduct: async id => {
		const state = get()
		if (!state.products.some(p => p.id === id)) {
			return { success: false, message: 'Produk tidak ditemukan.' }
		}

		set({ syncStatus: 'syncing', syncMessage: 'Menghapus produk dari database...' })

		try {
			const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
				method: 'DELETE',
			})

			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				const msg = data.error || 'Gagal menghapus produk'
				set({ syncStatus: 'error', syncMessage: msg })
				return { success: false, message: msg }
			}

			const updatedBottleStock = { ...state.bottleStock }
			delete updatedBottleStock[id]

			set({
				products: state.products.filter(p => p.id !== id),
				bottleStock: updatedBottleStock,
				syncStatus: 'idle',
				syncMessage: '',
			})
			return { success: true }
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Gagal menghubungi server'
			set({ syncStatus: 'error', syncMessage: msg })
			return { success: false, message: msg }
		}
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
					(data as { error?: string }).error || `Gagal menyimpan stok jerigen (${response.status})`
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
