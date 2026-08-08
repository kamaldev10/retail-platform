import { create } from 'zustand'
import { createCatalogSlice } from './slices/catalogSlice'
import { createShiftSlice } from './slices/shiftSlice'
import { createRecapSlice } from './slices/recapSlice'
import { createSalarySlice } from './slices/salarySlice'
import { createSyncSlice } from './slices/syncSlice'
import { GasolineStore, SalaryPaymentItem } from './types'

export type { SalaryPaymentItem }

export const useGasolineStore = create<GasolineStore>()((...a) => ({
	...createCatalogSlice(...a),
	...createShiftSlice(...a),
	...createRecapSlice(...a),
	...createSalarySlice(...a),
	...createSyncSlice(...a),
}))
