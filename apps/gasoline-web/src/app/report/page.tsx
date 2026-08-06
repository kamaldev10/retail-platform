'use client'

import React, { useState, useEffect } from 'react'
import { useGasolineStore } from '@/store/useGasolineStore'
import { groupByWeek, groupByMonth, PeriodRecap } from '@/lib/RecapAggregator'
import {
	formatRupiah,
	formatFloatComma,
	formatInputNumber,
	parseRupiah,
} from '@/lib/CurrencyFormatter'
import { DailyRecapResult } from '@/lib/calculations'
import {
	FileText,
	Calendar,
	ChevronDown,
	ChevronUp,
	Edit3,
	Trash2,
	X,
	CheckCircle,
} from 'lucide-react'

export default function ReportPage() {
	const { dailyRecaps, fetchRecapsFromCloud, updateRecap, deleteRecap } = useGasolineStore()
	const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly')
	const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null)

	// State for Edit Modal
	const [editingRecap, setEditingRecap] = useState<DailyRecapResult | null>(null)
	const [editUangAwal, setEditUangAwal] = useState('')
	const [editCashIn, setEditCashIn] = useState('')
	const [editBelanja, setEditBelanja] = useState('')
	const [editNote, setEditNote] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [feedback, setFeedback] = useState<string | null>(null)

	useEffect(() => {
		fetchRecapsFromCloud()
	}, [fetchRecapsFromCloud])

	const weeklyData = groupByWeek(dailyRecaps)
	const monthlyData = groupByMonth(dailyRecaps)

	const displayData = activeTab === 'weekly' ? weeklyData : monthlyData

	const toggleExpand = (period: string) => {
		setExpandedPeriod(prev => (prev === period ? null : period))
	}

	const openEditModal = (daily: DailyRecapResult) => {
		setEditingRecap(daily)
		setEditUangAwal(formatRupiah(daily.uangAwal || 0))
		setEditCashIn(formatRupiah(daily.cashSummary.cashIn || 0))
		setEditBelanja(formatRupiah(daily.belanja || 0))
		setEditNote(daily.note || '')
		setFeedback(null)
	}

	const handleSaveEdit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editingRecap) return

		setIsSubmitting(true)
		const parsedUangAwal = parseRupiah(editUangAwal)
		const parsedCashIn = parseRupiah(editCashIn)
		const parsedBelanja = parseRupiah(editBelanja)

		const res = await updateRecap(editingRecap.date, {
			uangAwal: parsedUangAwal,
			cashIn: parsedCashIn,
			belanja: parsedBelanja,
			cashOut: parsedUangAwal + parsedBelanja,
			note: editNote,
		})

		setIsSubmitting(false)
		if (res.success) {
			setEditingRecap(null)
			fetchRecapsFromCloud()
		} else {
			setFeedback(res.message || 'Gagal mengupdate rekap')
		}
	}

	const handleDelete = async (date: string) => {
		if (confirm(`Apakah Anda yakin ingin menghapus rekap tanggal ${date}?`)) {
			await deleteRecap(date)
			fetchRecapsFromCloud()
		}
	}

	return (
		<div className="flex flex-col gap-4 pb-20">
			{/* Header & Toggle */}
			<section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
						<FileText className="w-5 h-5 text-orange-500" /> Laporan Penjualan
					</h1>
					<span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
						{dailyRecaps.length} Hari Terdata
					</span>
				</div>

				{/* Tab Selector */}
				<div className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg">
					<button
						onClick={() => setActiveTab('weekly')}
						className={`py-2 text-xs font-bold rounded-md transition-all ${
							activeTab === 'weekly'
								? 'bg-white text-orange-600 shadow-sm'
								: 'text-gray-500 hover:text-gray-900'
						}`}
					>
						📅 Rekap Mingguan
					</button>
					<button
						onClick={() => setActiveTab('monthly')}
						className={`py-2 text-xs font-bold rounded-md transition-all ${
							activeTab === 'monthly'
								? 'bg-white text-orange-600 shadow-sm'
								: 'text-gray-500 hover:text-gray-900'
						}`}
					>
						🗓️ Rekap Bulanan
					</button>
				</div>
			</section>

			{/* Content List */}
			{displayData.length === 0 ? (
				<section className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
					Belum ada data rekap harian untuk diakumulasikan. Lakukan penutupan shift terlebih dahulu.
				</section>
			) : (
				<section className="flex flex-col gap-3">
					{displayData.map((item: PeriodRecap) => {
						const isExpanded = expandedPeriod === item.period

						return (
							<div
								key={item.period}
								className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden"
							>
								{/* Header Card */}
								<div
									onClick={() => toggleExpand(item.period)}
									className="p-4 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col gap-2"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Calendar className="w-4 h-4 text-orange-500" />
											<span className="text-xs font-black text-gray-900">{item.dateRange}</span>
										</div>
										<div className="flex items-center gap-1.5">
											<span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
												{item.totalDays} hari
											</span>
											{isExpanded ? (
												<ChevronUp className="w-4 h-4 text-gray-400" />
											) : (
												<ChevronDown className="w-4 h-4 text-gray-400" />
											)}
										</div>
									</div>

									{/* Summary Grid */}
									<div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
										<div className="flex flex-col">
											<span className="text-[9px] font-bold text-gray-400 uppercase">
												Terjual (Liter)
											</span>
											<span className="text-xs font-bold text-gray-800">
												{formatFloatComma(item.totalSoldLiters, 1)} L
											</span>
										</div>

										<div className="flex flex-col">
											<span className="text-[9px] font-bold text-gray-400 uppercase">Omset</span>
											<span className="text-xs font-bold text-gray-900">
												{formatRupiah(item.totalRevenue)}
											</span>
										</div>

										<div className="flex flex-col">
											<span className="text-[9px] font-bold text-gray-400 uppercase">
												Profit Bersih
											</span>
											<span className="text-xs font-extrabold text-green-600">
												{formatRupiah(item.totalNetProfit)}
											</span>
										</div>
									</div>
								</div>

								{/* Drilldown Details (Accordion) */}
								{isExpanded && (
									<div className="bg-slate-50 p-3 border-t border-gray-150 flex flex-col gap-2">
										<h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
											Rincian Harian dalam Periode Ini
										</h4>
										<div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
											<table className="w-full text-left border-collapse text-[10px]">
												<thead>
													<tr className="bg-slate-100 border-b border-gray-200 text-gray-500 font-bold uppercase">
														<th className="py-2 px-2">Tanggal</th>
														<th className="py-2 px-2 text-right">Liter</th>
														<th className="py-2 px-2 text-right">Uang Akhir</th>
														<th className="py-2 px-2 text-right">Profit</th>
														<th className="py-2 px-2 text-center">Aksi</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-gray-100 text-gray-700">
													{item.items.map(daily => (
														<tr key={daily.id}>
															<td className="py-2 px-2 font-medium">{daily.date}</td>
															<td className="py-2 px-2 text-right font-mono">
																{formatFloatComma(daily.totalSoldLiters, 1)} L
															</td>
															<td className="py-2 px-2 text-right font-mono font-bold text-gray-900">
																{formatRupiah(daily.cashSummary.cashIn)}
															</td>
															<td className="py-2 px-2 text-right font-mono text-green-600 font-bold">
																{formatRupiah(daily.totalNetProfit)}
															</td>
															<td className="py-2 px-2 text-center">
																<div className="flex items-center justify-center gap-1">
																	<button
																		onClick={() => openEditModal(daily)}
																		title="Edit Rekap"
																		className="p-1 text-blue-600 hover:bg-blue-50 rounded"
																	>
																		<Edit3 className="w-3.5 h-3.5" />
																	</button>
																	<button
																		onClick={() => handleDelete(daily.date)}
																		title="Hapus Rekap"
																		className="p-1 text-red-600 hover:bg-red-50 rounded"
																	>
																		<Trash2 className="w-3.5 h-3.5" />
																	</button>
																</div>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								)}
							</div>
						)
					})}
				</section>
			)}

			{/* Edit Modal Dialog */}
			{editingRecap && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-xl max-w-md w-full p-5 flex flex-col gap-4 shadow-xl">
						<div className="flex items-center justify-between border-b border-gray-100 pb-3">
							<h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
								<Edit3 className="w-4 h-4 text-orange-500" /> Edit Rekap ({editingRecap.date})
							</h3>
							<button
								onClick={() => setEditingRecap(null)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{feedback && (
							<div className="bg-red-50 text-red-600 text-xs p-2.5 rounded-lg border border-red-200">
								{feedback}
							</div>
						)}

						<form onSubmit={handleSaveEdit} className="flex flex-col gap-3 text-xs">
							<div className="flex flex-col gap-1">
								<label htmlFor="edit-cash-in" className="font-bold text-gray-700">
									Uang Akhir di Laci (Kas Masuk Real)
								</label>
								<input
									id="edit-cash-in"
									type="text"
									value={editCashIn}
									onChange={e => setEditCashIn(formatInputNumber(e.target.value))}
									className="p-2.5 rounded-lg border border-gray-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label htmlFor="edit-uang-awal" className="font-bold text-gray-700">
									Uang Awal Modal Kasir
								</label>
								<input
									id="edit-uang-awal"
									type="text"
									value={editUangAwal}
									onChange={e => setEditUangAwal(formatInputNumber(e.target.value))}
									className="p-2.5 rounded-lg border border-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label htmlFor="edit-belanja" className="font-bold text-gray-700">
									Belanja Bensin / Pengeluaran Lain
								</label>
								<input
									id="edit-belanja"
									type="text"
									value={editBelanja}
									onChange={e => setEditBelanja(formatInputNumber(e.target.value))}
									className="p-2.5 rounded-lg border border-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label htmlFor="edit-note" className="font-bold text-gray-700">
									Catatan
								</label>
								<input
									id="edit-note"
									type="text"
									value={editNote}
									onChange={e => setEditNote(e.target.value)}
									placeholder="Catatan perbaikan..."
									className="p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
								/>
							</div>

							<div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
								<button
									type="button"
									onClick={() => setEditingRecap(null)}
									className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-bold"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50"
								>
									<CheckCircle className="w-4 h-4" />
									{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
