import { StateCreator } from 'zustand'
import { PRODUCTS } from '../../lib/calculations'
import { CatalogSliceState, CatalogSliceActions, GasolineStore } from '../types'

export type CatalogSlice = CatalogSliceState & CatalogSliceActions

export const createCatalogSlice: StateCreator<GasolineStore, [], [], CatalogSlice> = (set, get) => ({
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

	updateStocksDirectly: (jerigen, bottles) => {
		set({
			jerigenStock: jerigen,
			bottleStock: bottles,
		})
	},
})
