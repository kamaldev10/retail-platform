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
	CalendarDays,
	ChevronDown,
	ChevronUp,
	Edit3,
	Trash2,
	X,
	CheckCircle,
	AlertTriangle,
	BarChart3,
} from 'lucide-react'
import { Pagination } from '@/components/common/Pagination'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function ReportPage() {
	const { dailyRecaps, recapPagination, fetchRecapsFromCloud, updateRecap, deleteRecap } =
		useGasolineStore()
	const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly')
	const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null)

	// State for Edit Modal & Delete Dialog
	const [editingRecap, setEditingRecap] = useState<DailyRecapResult | null>(null)
	const [deletingDate, setDeletingDate] = useState<string | null>(null)
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
			toast.success('Rekap harian berhasil diperbarui')
			setEditingRecap(null)
			fetchRecapsFromCloud()
		} else {
			const msg = res.message || 'Gagal memperbarui rekap harian'
			setFeedback(msg)
			toast.error(msg)
		}
	}

	const confirmDelete = async () => {
		if (!deletingDate) return
		const dateToDelete = deletingDate
		setDeletingDate(null)
		const res = await deleteRecap(dateToDelete)
		if (res.success) {
			toast.success(`Rekap tanggal ${dateToDelete} berhasil dihapus`)
			fetchRecapsFromCloud()
		} else {
			toast.error(res.message || 'Gagal menghapus rekap')
		}
	}

	return (
		<div className="flex flex-col gap-4 pb-20">
			{/* Header Card & Period Selector */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-1.5 text-slate-900">
							<FileText className="w-4 h-4 text-orange-500" />
							<span>Laporan Rekap Penjualan</span>
						</CardTitle>
						<Badge variant="orange">{dailyRecaps.length} Hari Terdata</Badge>
					</div>
					<CardDescription className="mt-1">
						Agregasi rekap penjualan harian dalam periode mingguan dan bulanan.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
						<button
							type="button"
							onClick={() => setActiveTab('weekly')}
							className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all ${
								activeTab === 'weekly'
									? 'bg-white text-orange-600 shadow-sm'
									: 'text-slate-500 hover:text-slate-900'
							}`}
						>
							<Calendar className="w-3.5 h-3.5" />
							<span>Rekap Mingguan</span>
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('monthly')}
							className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all ${
								activeTab === 'monthly'
									? 'bg-white text-orange-600 shadow-sm'
									: 'text-slate-500 hover:text-slate-900'
							}`}
						>
							<CalendarDays className="w-3.5 h-3.5" />
							<span>Rekap Bulanan</span>
						</button>
					</div>
				</CardContent>
			</Card>

			{/* List Recaps */}
			{displayData.length === 0 ? (
				<Card className="border-dashed border-slate-200">
					<CardContent className="py-8 text-center text-xs text-slate-400 font-medium">
						Belum ada data rekap harian untuk diakumulasikan. Lakukan penutupan shift terlebih
						dahulu.
					</CardContent>
				</Card>
			) : (
				<div className="flex flex-col gap-3">
					{displayData.map((item: PeriodRecap) => {
						const isExpanded = expandedPeriod === item.period

						return (
							<Card key={item.period} className="overflow-hidden">
								<div
									onClick={() => toggleExpand(item.period)}
									className="p-4 cursor-pointer hover:bg-slate-50/80 transition-colors flex flex-col gap-3"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Calendar className="w-4 h-4 text-orange-500" />
											<span className="text-xs font-extrabold text-slate-900">
												{item.dateRange}
											</span>
										</div>
										<div className="flex items-center gap-1.5">
											<Badge variant="secondary">{item.totalDays} hari</Badge>
											{isExpanded ? (
												<ChevronUp className="w-4 h-4 text-slate-400" />
											) : (
												<ChevronDown className="w-4 h-4 text-slate-400" />
											)}
										</div>
									</div>

									{/* Summary Metric Grid */}
									<div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
										<div className="flex flex-col">
											<span className="text-[9px] font-bold text-slate-400 uppercase">
												Volume Terjual
											</span>
											<span className="text-xs font-extrabold text-slate-800 font-mono">
												{formatFloatComma(item.totalSoldLiters, 1)} L
											</span>
										</div>

										<div className="flex flex-col">
											<span className="text-[9px] font-bold text-slate-400 uppercase">
												Total Omset
											</span>
											<span className="text-xs font-extrabold text-slate-900 font-mono">
												{formatRupiah(item.totalRevenue)}
											</span>
										</div>

										<div className="flex flex-col">
											<span className="text-[9px] font-bold text-slate-400 uppercase">
												Profit Bersih
											</span>
											<span className="text-xs font-extrabold text-emerald-600 font-mono">
												{formatRupiah(item.totalNetProfit)}
											</span>
										</div>
									</div>
								</div>

								{/* Drilldown Details Table */}
								{isExpanded && (
									<div className="bg-slate-50 p-3.5 border-t border-slate-100 flex flex-col gap-2.5">
										<div className="flex items-center justify-between">
											<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
												<BarChart3 className="w-3 h-3 text-orange-500" /> Rincian Harian Periode Ini
											</span>
										</div>

										<div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
											<table className="w-full text-left border-collapse text-[10px]">
												<thead>
													<tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
														<th className="py-2 px-2.5">Tanggal</th>
														<th className="py-2 px-2 text-right">Liter</th>
														<th className="py-2 px-2 text-right">Uang Akhir</th>
														<th className="py-2 px-2 text-right">Profit</th>
														<th className="py-2 px-2 text-center">Aksi</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-slate-100 text-slate-700">
													{item.items.map(daily => (
														<tr key={daily.id} className="hover:bg-slate-50 transition-colors">
															<td className="py-2.5 px-2.5 font-bold text-slate-900">
																{daily.date}
															</td>
															<td className="py-2.5 px-2 text-right font-mono font-medium">
																{formatFloatComma(daily.totalSoldLiters, 1)} L
															</td>
															<td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
																{formatRupiah(daily.cashSummary.cashIn)}
															</td>
															<td className="py-2.5 px-2 text-right font-mono text-emerald-600 font-bold">
																{formatRupiah(daily.totalNetProfit)}
															</td>
															<td className="py-2.5 px-2 text-center">
																<div className="flex items-center justify-center gap-1">
																	<button
																		type="button"
																		onClick={e => {
																			e.stopPropagation()
																			openEditModal(daily)
																		}}
																		title="Edit Rekap"
																		aria-label={`Edit rekap ${daily.date}`}
																		className="p-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
																	>
																		<Edit3 className="w-3.5 h-3.5" />
																	</button>
																	<button
																		type="button"
																		onClick={e => {
																			e.stopPropagation()
																			setDeletingDate(daily.date)
																		}}
																		title="Hapus Rekap"
																		aria-label={`Hapus rekap ${daily.date}`}
																		className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
							</Card>
						)
					})}
				</div>
			)}

			<Pagination
				pagination={recapPagination}
				onPageChange={p => fetchRecapsFromCloud(p, recapPagination.limit)}
				onLimitChange={l => fetchRecapsFromCloud(1, l)}
			/>

			{/* Modal Dialog Edit Rekap */}
			{editingRecap && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<Card className="w-full max-w-md shadow-2xl">
						<CardHeader className="pb-3 border-b border-slate-100">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
									<Edit3 className="w-4 h-4 text-orange-500" /> Edit Rekap ({editingRecap.date})
								</CardTitle>
								<button
									type="button"
									onClick={() => setEditingRecap(null)}
									className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						</CardHeader>
						<CardContent className="pt-4 flex flex-col gap-3">
							{feedback && (
								<div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
									{feedback}
								</div>
							)}

							<form onSubmit={handleSaveEdit} className="flex flex-col gap-3.5">
								<div className="flex flex-col gap-1">
									<label htmlFor="edit-cash-in" className="text-xs font-bold text-slate-700">
										Uang Akhir di Laci (Kas Masuk Real)
									</label>
									<input
										id="edit-cash-in"
										type="text"
										value={editCashIn}
										onChange={e => setEditCashIn(formatInputNumber(e.target.value))}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500"
									/>
								</div>

								<div className="flex flex-col gap-1">
									<label htmlFor="edit-uang-awal" className="text-xs font-bold text-slate-700">
										Uang Awal Modal Kasir
									</label>
									<input
										id="edit-uang-awal"
										type="text"
										value={editUangAwal}
										onChange={e => setEditUangAwal(formatInputNumber(e.target.value))}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500"
									/>
								</div>

								<div className="flex flex-col gap-1">
									<label htmlFor="edit-belanja" className="text-xs font-bold text-slate-700">
										Belanja Bensin / Pengeluaran Kas
									</label>
									<input
										id="edit-belanja"
										type="text"
										value={editBelanja}
										onChange={e => setEditBelanja(formatInputNumber(e.target.value))}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500"
									/>
								</div>

								<div className="flex flex-col gap-1">
									<label htmlFor="edit-note" className="text-xs font-bold text-slate-700">
										Catatan Penjelasan
									</label>
									<input
										id="edit-note"
										type="text"
										value={editNote}
										onChange={e => setEditNote(e.target.value)}
										placeholder="Catatan perbaikan..."
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-orange-500"
									/>
								</div>

								<div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
									<Button type="button" variant="outline" onClick={() => setEditingRecap(null)}>
										Batal
									</Button>
									<Button
										type="submit"
										variant="orange"
										disabled={isSubmitting}
										className="flex items-center gap-1.5"
									>
										<CheckCircle className="w-4 h-4" />
										<span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Modal Confirmation Hapus Rekap */}
			{deletingDate && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<Card className="w-full max-w-sm shadow-2xl">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<AlertTriangle className="w-4 h-4 text-red-500" /> Hapus Rekap Harian?
							</CardTitle>
							<CardDescription>
								Apakah Anda yakin ingin menghapus rekap harian tanggal{' '}
								<span className="font-bold text-slate-900">{deletingDate}</span>? Tautan data ini
								akan dihapus dari database.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex justify-end gap-2 pt-2">
							<Button variant="outline" onClick={() => setDeletingDate(null)}>
								Batal
							</Button>
							<Button variant="destructive" onClick={confirmDelete}>
								Ya, Hapus
							</Button>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
