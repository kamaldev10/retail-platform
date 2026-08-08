import { StateCreator } from 'zustand'
import { SyncSliceState, SyncSliceActions, GasolineStore } from '../types'

export type SyncSlice = SyncSliceState & SyncSliceActions

export const createSyncSlice: StateCreator<GasolineStore, [], [], SyncSlice> = set => ({
	syncStatus: 'idle',
	syncMessage: '',

	setSyncStatus: (status, message = '') =>
		set({
			syncStatus: status,
			syncMessage: message,
		}),
})
