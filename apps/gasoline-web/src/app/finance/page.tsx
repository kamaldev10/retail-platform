'use client'

import React, { useEffect, useState } from 'react'
import { useGasolineStore } from '@/store/useGasolineStore'
import { Landmark, ArrowUpRight, ArrowDownRight, Plus, Filter, Wallet } from 'lucide-react'
import { formatRupiah } from '@/lib/CurrencyFormatter'
import { formatDateID } from '@/lib/DateFormatter'
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
	const { financeEntries, financeSummary, fetchFinancesFromCloud, addFinanceEntry } =
		useGasolineStore()

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
		fetchFinancesFromCloud({ category: selectedCategory || undefined })
	}, [fetchFinancesFromCloud, selectedCategory])

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
			{/* Ledger Overview Card */}
			<section className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 uppercase">
						<Landmark className="w-4 h-4 text-orange-500" /> Buku Kas Utama (Central Ledger)
					</h2>
					<button
						onClick={() => setShowAddModal(true)}
						className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
					>
						<Plus className="w-3.5 h-3.5" />
						Catat Kas
					</button>
				</div>

				<div className="flex flex-col border-b border-gray-100 pb-4">
					<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
						Total Saldo / Arus Kas Bersih
					</span>
					<span
						className={`text-2xl font-black mt-1 ${
							financeSummary.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'
						}`}
					>
						{formatRupiah(financeSummary.netCashflow)}
					</span>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="flex items-start gap-2.5">
						<div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
							<ArrowUpRight className="w-4 h-4" />
						</div>
						<div className="flex flex-col">
							<span className="text-[9px] font-bold text-gray-400 uppercase">Total Uang Masuk</span>
							<span className="text-sm font-bold text-gray-800">
								{formatRupiah(financeSummary.totalInflow)}
							</span>
						</div>
					</div>

					<div className="flex items-start gap-2.5">
						<div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-600 flex-shrink-0">
							<ArrowDownRight className="w-4 h-4" />
						</div>
						<div className="flex flex-col">
							<span className="text-[9px] font-bold text-gray-400 uppercase">
								Total Uang Keluar
							</span>
							<span className="text-sm font-bold text-gray-800">
								{formatRupiah(financeSummary.totalOutflow)}
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* Filter Section */}
			<section className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
						<Filter className="w-3.5 h-3.5 text-gray-400" /> Filter Kategori
					</h2>
				</div>
				<div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
					<button
						onClick={() => setSelectedCategory('')}
						className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
							selectedCategory === ''
								? 'bg-orange-500 text-white shadow-sm'
								: 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
						}`}
					>
						Semua
					</button>
					{Object.entries(CATEGORY_LABELS).map(([key, label]) => (
						<button
							key={key}
							onClick={() => setSelectedCategory(key)}
							className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
								selectedCategory === key
									? 'bg-orange-500 text-white shadow-sm'
									: 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
							}`}
						>
							{label}
						</button>
					))}
				</div>
			</section>

			{/* Ledger Log History */}
			<section className="flex flex-col gap-2 mt-1">
				<h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
					Riwayat Transaksi Keuangan (locale id-ID)
				</h2>

				{financeEntries.length === 0 ? (
					<div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
						Belum ada catatan keuangan untuk kategori ini.
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{financeEntries.map(entry => (
							<div
								key={entry.id}
								className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between"
							>
								<div className="flex items-center gap-3">
									<div
										className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
											entry.flowType === 'IN'
												? 'bg-green-50 text-green-600'
												: 'bg-red-50 text-red-600'
										}`}
									>
										{entry.flowType === 'IN' ? (
											<ArrowUpRight className="w-5 h-5" />
										) : (
											<ArrowDownRight className="w-5 h-5" />
										)}
									</div>
									<div className="flex flex-col gap-0.5">
										<span className="text-xs font-bold text-gray-900">
											{CATEGORY_LABELS[entry.category] || entry.category}
										</span>
										<span className="text-[10px] text-gray-500 font-medium">
											{formatDateID(entry.transactionDate)} • {entry.paymentMethod}
										</span>
										{entry.description && (
											<span className="text-[10px] text-gray-400 italic">{entry.description}</span>
										)}
									</div>
								</div>

								<div className="flex flex-col items-end">
									<span
										className={`text-xs font-black ${
											entry.flowType === 'IN' ? 'text-green-600' : 'text-red-600'
										}`}
									>
										{entry.flowType === 'IN' ? '+' : '-'} {formatRupiah(entry.amount)}
									</span>
									<span className="text-[9px] text-gray-400 uppercase font-semibold">
										{entry.referenceType || 'MANUAL'}
									</span>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			{/* Manual Entry Modal */}
			{showAddModal && (
				<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl flex flex-col gap-4 border border-gray-100">
						<div className="flex items-center justify-between border-b border-gray-100 pb-3">
							<h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
								<Wallet className="w-4 h-4 text-orange-500" /> Catat Transaksi Kas Manual
							</h3>
							<button
								onClick={() => setShowAddModal(false)}
								className="text-gray-400 hover:text-gray-600 text-sm font-bold"
							>
								✕
							</button>
						</div>

						<form onSubmit={handleSubmitManualEntry} className="flex flex-col gap-3">
							{/* Flow Type */}
							<div className="flex flex-col gap-1">
								<label className="text-xs font-bold text-gray-700">Tipe Arus Kas</label>
								<div className="grid grid-cols-2 gap-2">
									<button
										type="button"
										onClick={() =>
											setFormData({ ...formData, flowType: 'IN', category: 'CAPITAL_INJECTION' })
										}
										className={`py-2 rounded-lg text-xs font-bold border transition-all ${
											formData.flowType === 'IN'
												? 'bg-green-500 text-white border-green-500 shadow-sm'
												: 'bg-gray-50 text-gray-700 border-gray-200'
										}`}
									>
										+ Uang Masuk (IN)
									</button>
									<button
										type="button"
										onClick={() => setFormData({ ...formData, flowType: 'OUT', category: 'OTHER' })}
										className={`py-2 rounded-lg text-xs font-bold border transition-all ${
											formData.flowType === 'OUT'
												? 'bg-red-500 text-white border-red-500 shadow-sm'
												: 'bg-gray-50 text-gray-700 border-gray-200'
										}`}
									>
										- Uang Keluar (OUT)
									</button>
								</div>
							</div>

							{/* Category */}
							<div className="flex flex-col gap-1">
								<label className="text-xs font-bold text-gray-700">Kategori</label>
								<select
									value={formData.category}
									onChange={e => setFormData({ ...formData, category: e.target.value })}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-orange-500"
								>
									{formData.flowType === 'IN' ? (
										<>
											<option value="CAPITAL_INJECTION">CAPITAL_INJECTION (Tambahan Modal)</option>
											<option value="INITIAL_CASH">INITIAL_CASH (Kas Awal)</option>
											<option value="SALES_REVENUE">SALES_REVENUE (Pendapatan Penjualan)</option>
											<option value="OTHER">OTHER (Pemasukan Lainnya)</option>
										</>
									) : (
										<>
											<option value="OTHER">OTHER (Biaya Operasional / Lainnya)</option>
											<option value="FUEL_PURCHASE">FUEL_PURCHASE (Pembelian Bensin Bulk)</option>
											<option value="SALARY_PAYMENT">SALARY_PAYMENT (Pengeluaran Gaji)</option>
											<option value="OWNER_WITHDRAWAL">OWNER_WITHDRAWAL (Prive Owner)</option>
										</>
									)}
								</select>
							</div>

							{/* Amount */}
							<div className="flex flex-col gap-1">
								<label className="text-xs font-bold text-gray-700">Nominal (Rp)</label>
								<input
									type="number"
									placeholder="Contoh: 50000"
									value={formData.amount}
									onChange={e => setFormData({ ...formData, amount: e.target.value })}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-orange-500"
								/>
							</div>

							{/* Payment Method */}
							<div className="flex flex-col gap-1">
								<label className="text-xs font-bold text-gray-700">Metode Pembayaran</label>
								<select
									value={formData.paymentMethod}
									onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-orange-500"
								>
									<option value="CASH">CASH (Tunai)</option>
									<option value="TRANSFER">TRANSFER (Bank)</option>
									<option value="QRIS">QRIS</option>
								</select>
							</div>

							{/* Description */}
							<div className="flex flex-col gap-1">
								<label className="text-xs font-bold text-gray-700">Catatan / Keterangan</label>
								<input
									type="text"
									placeholder="Contoh: Bayar listrik / Tambahan botol"
									value={formData.description}
									onChange={e => setFormData({ ...formData, description: e.target.value })}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-orange-500"
								/>
							</div>

							<div className="flex justify-end gap-2 mt-2">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-lg"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-lg disabled:opacity-50"
								>
									{isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
