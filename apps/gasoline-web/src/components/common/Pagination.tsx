'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

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

	if (totalItems === 0) {
		return null
	}

	const startItem = (page - 1) * limit + 1
	const endItem = Math.min(page * limit, totalItems)

	return (
		<div
			className={`flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-150 shadow-sm text-xs font-medium text-gray-600 ${className}`}
		>
			<div className="flex items-center gap-2">
				<span>
					Menampilkan <strong className="text-gray-900">{startItem}</strong> -{' '}
					<strong className="text-gray-900">{endItem}</strong> dari{' '}
					<strong className="text-gray-900">{totalItems}</strong> data
				</span>
				{onLimitChange && (
					<div className="flex items-center gap-1 ml-2">
						<span className="text-gray-400">Tampilkan:</span>
						<select
							value={limit}
							onChange={e => onLimitChange(Number(e.target.value))}
							className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
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

			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={() => onPageChange(1)}
					disabled={!hasPrevPage}
					className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-all"
					title="Halaman Pertama"
				>
					<ChevronsLeft className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => onPageChange(page - 1)}
					disabled={!hasPrevPage}
					className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-all flex items-center gap-1 px-2.5 font-bold"
					title="Halaman Sebelumnya"
				>
					<ChevronLeft className="w-4 h-4" />
					<span className="hidden xs:inline">Sebelumnya</span>
				</button>

				<span className="px-3 py-1 bg-orange-50 text-orange-700 font-bold border border-orange-200 rounded-lg">
					{page} / {totalPages || 1}
				</span>

				<button
					type="button"
					onClick={() => onPageChange(page + 1)}
					disabled={!hasNextPage}
					className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-all flex items-center gap-1 px-2.5 font-bold"
					title="Halaman Selanjutnya"
				>
					<span className="hidden xs:inline">Selanjutnya</span>
					<ChevronRight className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => onPageChange(totalPages)}
					disabled={!hasNextPage}
					className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-all"
					title="Halaman Terakhir"
				>
					<ChevronsRight className="w-4 h-4" />
				</button>
			</div>
		</div>
	)
}
