'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	children: React.ReactNode
	title?: string
}

export function Sheet({ open, onOpenChange, children, title }: SheetProps) {
	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
			<div className="fixed inset-0" onClick={() => onOpenChange(false)} aria-hidden="true" />
			<div className="relative w-full max-w-md bg-slate-900 text-white rounded-t-2xl p-5 shadow-2xl mt-auto z-10 animate-in slide-in-from-bottom duration-200 border-t border-slate-800">
				<div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
					<h2 className="text-sm font-extrabold text-white tracking-tight">
						{title || 'Menu Lainnya'}
					</h2>
					<button
						onClick={() => onOpenChange(false)}
						className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
						aria-label="Tutup Menu"
					>
						<X className="w-5 h-5" />
					</button>
				</div>
				<div>{children}</div>
			</div>
		</div>
	)
}
