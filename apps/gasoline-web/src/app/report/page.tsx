'use client'

import React, { useState, useEffect } from 'react'
import { useGasolineStore } from '@/store/useGasolineStore'
import { groupByWeek, groupByMonth, PeriodRecap } from '@/lib/RecapAggregator'
import { formatRupiah, formatFloatComma } from '@/lib/CurrencyFormatter'
import { FileText, Calendar, TrendingUp, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react'

export default function ReportPage() {
	const { dailyRecaps, fetchRecapsFromCloud } = useGasolineStore()
	const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly')
	const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null)

	useEffect(() => {
		fetchRecapsFromCloud()
	}, [fetchRecapsFromCloud])

	const weeklyData = groupByWeek(dailyRecaps)
	const monthlyData = groupByMonth(dailyRecaps)

	const displayData = activeTab === 'weekly' ? weeklyData : monthlyData

	const toggleExpand = (period: string) => {
		setExpandedPeriod(prev => (prev === period ? null : period))
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
														<th className="py-2 px-2 text-right">Omset</th>
														<th className="py-2 px-2 text-right">Profit</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-gray-100 text-gray-700">
													{item.items.map(daily => (
														<tr key={daily.id}>
															<td className="py-1.5 px-2 font-medium">{daily.date}</td>
															<td className="py-1.5 px-2 text-right font-mono">
																{formatFloatComma(daily.totalSoldLiters, 1)} L
															</td>
															<td className="py-1.5 px-2 text-right font-mono">
																{formatRupiah(daily.totalRevenue)}
															</td>
															<td className="py-1.5 px-2 text-right font-mono text-green-600 font-bold">
																{formatRupiah(daily.totalNetProfit)}
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
		</div>
	)
}
