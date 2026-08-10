'use client'

import { Pagination } from '@/components/common/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupiah } from '@/lib/CurrencyFormatter'
import { formatDateID } from '@/lib/DateFormatter'
import { useGasolineStore } from '@/store/useGasolineStore'
import {
	ArrowDownRight,
	ArrowUpRight,
	CheckCircle,
	Filter,
	Landmark,
	Plus,
	Wallet,
	X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

const CATEGORY_LABELS: Record<string, string> = {
	SALES_REVENUE: 'Omset Penjualan',
	FUEL_PURCHASE: 'Pembelian Bensin Bulk',
	SALARY_PAYMENT: 'Pengeluaran Gaji',
	INITIAL_CASH: 'Uang Awal Kasir',
	CAPITAL_INJECTION: 'Tambahan Modal',
	OWNER_WITHDRAWAL: 'Prive Owner',
	OTHER: 'Lain-Lain',
}

export default function FinancePage() {
	const {
		financeEntries,
		financeSummary,
		financePagination,
		fetchFinancesFromCloud,
		addFinanceEntry,
	} = useGasolineStore()

	const [selectedCategory, setSelectedCategory] = useState<string>('')
	const [showAddModal, setShowAddModal] = useState(false)
	const [formData, setFormData] = useState({
		flowType: 'OUT' as 'IN' | 'OUT',
		category: 'OTHER',
		amount: '',
		paymentMethod: 'CASH' as 'CASH' | 'TRANSFER' | 'QRIS',
		description: '',
	})
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		fetchFinancesFromCloud({
			page: 1,
			limit: financePagination.limit || 20,
			category: selectedCategory || undefined,
		})
	}, [fetchFinancesFromCloud, selectedCategory, financePagination.limit])

	const handleSubmitManualEntry = async (e: React.FormEvent) => {
		e.preventDefault()
		const numAmount = Number(formData.amount)
		if (!numAmount || numAmount <= 0) {
			toast.error('Nominal transaksi harus lebih besar dari 0')
			return
		}

		setIsSubmitting(true)
		const res = await addFinanceEntry({
			flowType: formData.flowType,
			category: formData.category as any,
			amount: numAmount,
			paymentMethod: formData.paymentMethod,
			description: formData.description,
		})

		setIsSubmitting(false)
		if (res.success) {
			toast.success('Transaksi keuangan berhasil ditambahkan')
			setShowAddModal(false)
			setFormData({
				flowType: 'OUT',
				category: 'OTHER',
				amount: '',
				paymentMethod: 'CASH',
				description: '',
			})
		} else {
			toast.error(res.message || 'Gagal menyimpan transaksi')
		}
	}

	return (
		<div className="flex flex-col gap-4 pb-20">
			{/* Overview Central Ledger Card */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-1.5 text-slate-900">
							<Landmark className="w-4 h-4 text-orange-500" />
							<span>Buku Kas Utama</span>
						</CardTitle>
						<Button variant="orange" size="sm" onClick={() => setShowAddModal(true)}>
							<Plus className="w-3.5 h-3.5 mr-1" />
							<span>Catat Kas</span>
						</Button>
					</div>
					<CardDescription>
						Ringkasan arus kas masuk, pengeluaran, dan saldo bersih toko.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex flex-col border-b border-slate-100 pb-3">
						<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
							Total Saldo / Arus Kas Bersih
						</span>
						<span
							className={`text-2xl font-black mt-1 font-mono ${
								financeSummary.netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'
							}`}
						>
							{formatRupiah(financeSummary.netCashflow)}
						</span>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
							<div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
								<ArrowUpRight className="w-4 h-4" />
							</div>
							<div className="flex flex-col">
								<span className="text-[9px] font-bold text-slate-500 uppercase">Uang Masuk</span>
								<span className="text-xs font-extrabold text-slate-900 font-mono">
									{formatRupiah(financeSummary.totalInflow)}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
							<div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center flex-shrink-0">
								<ArrowDownRight className="w-4 h-4" />
							</div>
							<div className="flex flex-col">
								<span className="text-[9px] font-bold text-slate-500 uppercase">Uang Keluar</span>
								<span className="text-xs font-extrabold text-slate-900 font-mono">
									{formatRupiah(financeSummary.totalOutflow)}
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Filter Section */}
			<section className="flex flex-col gap-2 overflow-hidden">
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
						<Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Kategori Kas
					</span>
				</div>
				<div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
					<button
						type="button"
						onClick={() => setSelectedCategory('')}
						className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
							selectedCategory === ''
								? 'bg-orange-500 text-white shadow-sm'
								: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
						}`}
					>
						Semua
					</button>
					{Object.entries(CATEGORY_LABELS).map(([key, label]) => (
						<button
							type="button"
							key={key}
							onClick={() => setSelectedCategory(key)}
							className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
								selectedCategory === key
									? 'bg-orange-500 text-white shadow-sm'
									: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
							}`}
						>
							{label}
						</button>
					))}
				</div>
			</section>

			{/* History Entries */}
			<section className="flex flex-col gap-2.5">
				<span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
					Riwayat Transaksi Buku Kas
				</span>

				{financeEntries.length === 0 ? (
					<Card className="border-dashed border-slate-200">
						<CardContent className="py-8 text-center text-xs text-slate-400 font-medium">
							Belum ada catatan transaksi kas pada kategori ini.
						</CardContent>
					</Card>
				) : (
					<div className="flex flex-col gap-2">
						{financeEntries.map(entry => (
							<Card key={entry.id} className="p-3.5 flex items-center justify-between shadow-sm">
								<div className="flex items-center gap-3">
									<div
										className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
											entry.flowType === 'IN'
												? 'bg-emerald-500/10 text-emerald-600'
												: 'bg-rose-500/10 text-rose-600'
										}`}
									>
										{entry.flowType === 'IN' ? (
											<ArrowUpRight className="w-4 h-4" />
										) : (
											<ArrowDownRight className="w-4 h-4" />
										)}
									</div>
									<div className="flex flex-col gap-0.5">
										<span className="text-xs font-bold text-slate-900">
											{CATEGORY_LABELS[entry.category] || entry.category}
										</span>
										<span className="text-[10px] text-slate-500 font-medium">
											{formatDateID(entry.transactionDate)} • {entry.paymentMethod}
										</span>
										{entry.description && (
											<span className="text-[10px] text-slate-400 italic leading-tight">
												{entry.description}
											</span>
										)}
									</div>
								</div>

								<div className="flex flex-col items-end">
									<span
										className={`text-xs font-extrabold font-mono ${
											entry.flowType === 'IN' ? 'text-emerald-600' : 'text-rose-600'
										}`}
									>
										{entry.flowType === 'IN' ? '+' : '-'} {formatRupiah(entry.amount)}
									</span>
									<Badge variant="outline" className="text-[8px] uppercase mt-0.5">
										{entry.referenceType || 'MANUAL'}
									</Badge>
								</div>
							</Card>
						))}
					</div>
				)}

				<Pagination
					pagination={financePagination}
					onPageChange={p =>
						fetchFinancesFromCloud({
							page: p,
							limit: financePagination.limit,
							category: selectedCategory || undefined,
						})
					}
					onLimitChange={l =>
						fetchFinancesFromCloud({
							page: 1,
							limit: l,
							category: selectedCategory || undefined,
						})
					}
					className="mt-2"
				/>
			</section>

			{/* Manual Entry Modal Dialog */}
			{showAddModal && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<Card className="w-full max-w-md shadow-2xl">
						<CardHeader className="pb-3 border-b border-slate-100">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
									<Wallet className="w-4 h-4 text-orange-500" />
									<span>Catat Transaksi Kas Manual</span>
								</CardTitle>
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						</CardHeader>
						<CardContent className="pt-4 flex flex-col gap-3">
							<form onSubmit={handleSubmitManualEntry} className="flex flex-col gap-3.5">
								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-bold text-slate-700">Tipe Arus Kas</label>
									<div className="grid grid-cols-2 gap-2">
										<button
											type="button"
											onClick={() =>
												setFormData({ ...formData, flowType: 'IN', category: 'CAPITAL_INJECTION' })
											}
											className={`py-2 rounded-lg text-xs font-bold transition-all border ${
												formData.flowType === 'IN'
													? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
													: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
											}`}
										>
											+ Uang Masuk (IN)
										</button>
										<button
											type="button"
											onClick={() =>
												setFormData({ ...formData, flowType: 'OUT', category: 'OTHER' })
											}
											className={`py-2 rounded-lg text-xs font-bold transition-all border ${
												formData.flowType === 'OUT'
													? 'bg-rose-500 text-white border-rose-500 shadow-sm'
													: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
											}`}
										>
											- Uang Keluar (OUT)
										</button>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<label htmlFor="finance-cat" className="text-xs font-bold text-slate-700">
										Kategori Transaksi
									</label>
									<select
										id="finance-cat"
										value={formData.category}
										onChange={e => setFormData({ ...formData, category: e.target.value })}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-orange-500"
									>
										{formData.flowType === 'IN' ? (
											<>
												<option value="CAPITAL_INJECTION">Tambahan Modal</option>
												<option value="INITIAL_CASH">Uang Awal Kasir</option>
												<option value="SALES_REVENUE">Pendapatan Penjualan</option>
												<option value="OTHER">Pemasukan Lainnya</option>
											</>
										) : (
											<>
												<option value="OTHER">Biaya Operasional / Lainnya</option>
												<option value="FUEL_PURCHASE">Pembelian Bensin Bulk</option>
												<option value="SALARY_PAYMENT">Pengeluaran Gaji</option>
												<option value="OWNER_WITHDRAWAL">Prive Owner</option>
											</>
										)}
									</select>
								</div>

								<div className="flex flex-col gap-1">
									<label htmlFor="finance-amount" className="text-xs font-bold text-slate-700">
										Nominal Transaksi (Rp)
									</label>
									<input
										id="finance-amount"
										type="number"
										placeholder="Contoh: 50000"
										value={formData.amount}
										onChange={e => setFormData({ ...formData, amount: e.target.value })}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-orange-500"
									/>
								</div>

								<div className="flex flex-col gap-1">
									<label htmlFor="finance-method" className="text-xs font-bold text-slate-700">
										Metode Pembayaran
									</label>
									<select
										id="finance-method"
										value={formData.paymentMethod}
										onChange={e =>
											setFormData({ ...formData, paymentMethod: e.target.value as any })
										}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-orange-500"
									>
										<option value="CASH">CASH (Tunai)</option>
										<option value="TRANSFER">TRANSFER (Bank)</option>
										<option value="QRIS">QRIS</option>
									</select>
								</div>

								<div className="flex flex-col gap-1">
									<label htmlFor="finance-desc" className="text-xs font-bold text-slate-700">
										Catatan Keterangan
									</label>
									<input
										id="finance-desc"
										type="text"
										placeholder="Contoh: Bayar listrik / Pembelian perlengkapan"
										value={formData.description}
										onChange={e => setFormData({ ...formData, description: e.target.value })}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-orange-500"
									/>
								</div>

								<div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
									<Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
										Batal
									</Button>
									<Button
										type="submit"
										variant="orange"
										disabled={isSubmitting}
										className="flex items-center gap-1.5"
									>
										<CheckCircle className="w-4 h-4" />
										<span>{isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
