'use client'

import React from 'react'
import { WifiOff, RefreshCw, Fuel, ShieldCheck } from 'lucide-react'

export default function OfflinePage() {
	const handleRetry = () => {
		if (typeof window !== 'undefined') {
			window.location.reload()
		}
	}

	return (
		<div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
			<div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 relative animate-pulse">
				<WifiOff className="w-10 h-10 text-orange-600" />
				<div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 text-white">
					<Fuel className="w-4 h-4 text-orange-400" />
				</div>
			</div>

			<h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
				Koneksi Terputus
			</h1>
			<p className="text-slate-600 text-sm mb-6 max-w-xs leading-relaxed">
				Anda sedang tidak terhubung ke internet. Namun jangan khawatir, **Gasoline Web** tetap dapat mencatat transaksi lokal Anda.
			</p>

			<div className="bg-slate-100 border border-slate-200 rounded-xl p-4 mb-6 w-full max-w-xs text-left">
				<div className="flex items-start gap-3">
					<ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
					<div>
						<h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
							Data Terjaga Aman
						</h2>
						<p className="text-xs text-slate-600">
							Input shift & stok tersimpan di IndexedDB browser Anda dan akan otomatis diunggah begitu koneksi pulih.
						</p>
					</div>
				</div>
			</div>

			<button
				onClick={handleRetry}
				className="w-full max-w-xs py-3 px-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all"
			>
				<RefreshCw className="w-4 h-4" />
				<span>Coba Muat Ulang</span>
			</button>
		</div>
	)
}
