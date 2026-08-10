'use client'

import { useGasolineStore } from '@/store/useGasolineStore'
import { AlertCircle, CloudUpload, RefreshCw } from 'lucide-react'

export function SyncStatusBanner() {
	const { syncStatus, syncMessage } = useGasolineStore()

	const isFetching = syncStatus === 'fetching'
	const isSyncing = syncStatus === 'syncing'
	const isError = syncStatus === 'error'

	return (
		<div className="w-full z-30 transition-all duration-300 flex-shrink-0 sticky top-0">
			{isFetching ? (
				<div className="bg-sky-950/95 backdrop-blur-md border-b border-sky-800/60 px-4 py-2.5 flex items-center justify-between text-sky-200 text-xs font-semibold shadow-md pt-[calc(0.5rem+env(safe-area-inset-top))]">
					<div className="flex items-center gap-2 min-w-0 pr-2">
						<RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin flex-shrink-0" />
						<span className="truncate">{syncMessage || 'Mengambil data dari database...'}</span>
					</div>
					<span className="text-[9px] bg-sky-900/80 text-sky-300 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase border border-sky-700/60 flex-shrink-0">
						Memuat Data
					</span>
				</div>
			) : isSyncing ? (
				<div className="bg-amber-950/95 backdrop-blur-md border-b border-amber-800/60 px-4 py-2.5 flex items-center justify-between text-amber-200 text-xs font-semibold shadow-md pt-[calc(0.5rem+env(safe-area-inset-top))]">
					<div className="flex items-center gap-2 min-w-0 pr-2">
						<CloudUpload className="w-3.5 h-3.5 text-amber-400 animate-bounce flex-shrink-0" />
						<span className="truncate">{syncMessage || 'Menyimpan data ke database...'}</span>
					</div>
					<span className="text-[9px] bg-amber-900/80 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase border border-amber-700/60 flex-shrink-0">
						Menyimpan Data
					</span>
				</div>
			) : isError ? (
				<div className="bg-rose-950/95 backdrop-blur-md border-b border-rose-800/60 px-4 py-2.5 flex items-center justify-between text-rose-200 text-xs font-semibold shadow-md pt-[calc(0.5rem+env(safe-area-inset-top))]">
					<div className="flex items-center gap-2 min-w-0 pr-2">
						<AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
						<span className="truncate">{syncMessage || 'Gagal terhubung ke database'}</span>
					</div>
					<span className="text-[9px] bg-rose-900/80 text-rose-300 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase border border-rose-700/60 flex-shrink-0">
						Sync Gagal
					</span>
				</div>
			) : (
				<div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex items-center justify-between text-slate-300 text-xs font-semibold shadow-sm pt-[calc(0.5rem+env(safe-area-inset-top))]">
					<div className="flex items-center gap-2 min-w-0 pr-2">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
						<span className="truncate text-slate-300 font-medium text-[11px]">
							Database Terhubung
						</span>
					</div>
					<span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase border border-slate-700 flex-shrink-0">
						Online
					</span>
				</div>
			)}
		</div>
	)
}
