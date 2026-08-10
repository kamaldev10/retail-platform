'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface PaginationMeta {
	page: number
	limit: number
	totalItems: number
	totalPages: number
	hasNextPage: boolean
	hasPrevPage: boolean
}

export interface PaginationProps {
	pagination: PaginationMeta
	onPageChange: (page: number) => void
	onLimitChange?: (limit: number) => void
	pageSizeOptions?: number[]
	className?: string
}

export function Pagination({
	pagination,
	onPageChange,
	onLimitChange,
	pageSizeOptions = [10, 20, 50, 100],
	className = '',
}: PaginationProps) {
	const { page, limit, totalItems, totalPages, hasNextPage, hasPrevPage } = pagination

	if (totalItems === 0) return null

	const startItem = (page - 1) * limit + 1
	const endItem = Math.min(page * limit, totalItems)

	return (
		<div
			className={`flex flex-col gap-3 bg-white p-3.5 my-3 rounded-xl border border-slate-200 shadow-sm text-xs ${className}`}
		>
			{/* BARIS 1: Informasi Data & Selector Jumlah Per Halaman */}
			<div className="flex items-center justify-between w-full pb-2.5 border-b border-slate-100">
				<span className="text-xs text-slate-600 font-medium">
					Menampilkan{' '}
					<strong className="text-slate-900 font-bold">
						{startItem}–{endItem}
					</strong>{' '}
					dari <strong className="text-slate-900 font-bold">{totalItems}</strong> data
				</span>

				{onLimitChange && (
					<div className="flex items-center gap-1.5 flex-shrink-0">
						<span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
							Tampilkan:
						</span>
						<select
							value={limit}
							onChange={e => onLimitChange(Number(e.target.value))}
							className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-orange-500 cursor-pointer outline-none"
						>
							{pageSizeOptions.map(opt => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			{/* BARIS 2: Tombol Kontrol Navigasi Halaman (Terpusat & Lapang) */}
			<div className="flex items-center justify-center gap-2 w-full pt-0.5">
				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={() => onPageChange(1)}
					disabled={!hasPrevPage}
					title="Halaman Pertama"
					aria-label="Halaman Pertama"
					className="h-9 w-9 rounded-lg flex-shrink-0"
				>
					<ChevronsLeft className="w-4 h-4 text-slate-600" />
				</Button>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page - 1)}
					disabled={!hasPrevPage}
					title="Halaman Sebelumnya"
					aria-label="Halaman Sebelumnya"
					className="h-9 px-3 text-xs font-bold flex items-center gap-1.5 rounded-lg"
				>
					<ChevronLeft className="w-4 h-4" />
					<span>Sebelumnya</span>
				</Button>

				<Badge
					variant="orange"
					className="h-9 px-3.5 font-mono font-bold text-xs rounded-lg flex items-center justify-center flex-shrink-0"
				>
					{page} / {totalPages || 1}
				</Badge>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page + 1)}
					disabled={!hasNextPage}
					title="Halaman Selanjutnya"
					aria-label="Halaman Selanjutnya"
					className="h-9 px-3 text-xs font-bold flex items-center gap-1.5 rounded-lg"
				>
					<span>Selanjutnya</span>
					<ChevronRight className="w-4 h-4" />
				</Button>

				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={() => onPageChange(totalPages)}
					disabled={!hasNextPage}
					title="Halaman Terakhir"
					aria-label="Halaman Terakhir"
					className="h-9 w-9 rounded-lg flex-shrink-0"
				>
					<ChevronsRight className="w-4 h-4 text-slate-600" />
				</Button>
			</div>
		</div>
	)
}
