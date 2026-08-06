'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGasolineStore } from '@/store/useGasolineStore'
import { formatRupiah, formatInputNumber, parseRupiah } from '@/lib/CurrencyFormatter'
import {
	openingStockSchema,
	OpeningStockFormData,
	closingStockSchema,
	ClosingStockFormData,
	purchaseSchema,
	PurchaseFormData,
	pourSchema,
	PourFormData,
} from '@/lib/schemas/gasoline'
import { Check, Loader2, ArrowRightLeft, ShoppingCart, Landmark } from 'lucide-react'

export default function ShiftPage() {
	const router = useRouter()
	const {
		products,
		jerigenStock,
		bottleStock,
		activeOpeningStock,
		activePushedBottles,
		activeDate,
		activeCashIn,
		activeCashOut,
		setOpeningStock,
		submitPurchase,
		pourFuelToBottles,
		submitClosingStock,
		fetchRecapsFromCloud,
	} = useGasolineStore()

	const [refillError, setRefillError] = useState<string | null>(null)
	const [pourError, setPourError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showSuccess, setShowSuccess] = useState(false)

	useEffect(() => {
		fetchRecapsFromCloud()
	}, [fetchRecapsFromCloud])

	// 1. Form Stok Awal
	const {
		register: registerOpen,
		handleSubmit: handleSubmitOpen,
		formState: { errors: errorsOpen },
		reset: resetOpen,
	} = useForm<OpeningStockFormData>({
		resolver: zodResolver(openingStockSchema),
		defaultValues: {
			date: new Date().toISOString().split('T')[0],
			uangAwal: '0',
			openingStocks: products.reduce(
				(acc, p) => {
					acc[p.id] = String(bottleStock[p.id] || 0)
					return acc
				},
				{} as Record<string, string>,
			) as unknown as Record<string, number>,
		} as unknown as OpeningStockFormData,
	})

	useEffect(() => {
		resetOpen({
			date: new Date().toISOString().split('T')[0],
			uangAwal: '0',
			openingStocks: products.reduce(
				(acc, p) => {
					acc[p.id] = String(bottleStock[p.id] || 0)
					return acc
				},
				{} as Record<string, string>,
			) as unknown as Record<string, number>,
		} as unknown as OpeningStockFormData)
	}, [products, bottleStock, resetOpen])

	// 2. Form Stok Akhir & Buku Kas
	const {
		register: registerClose,
		handleSubmit: handleSubmitClose,
		watch: watchClose,
		setValue: setValueClose,
		formState: { errors: errorsClose, dirtyFields: dirtyFieldsClose },
	} = useForm<ClosingStockFormData>({
		resolver: zodResolver(closingStockSchema),
		defaultValues: {
			uangAkhir: '0',
			note: '',
			closingStocks: products.reduce(
				(acc, p) => {
					acc[p.id] = '0'
					return acc
				},
				{} as Record<string, string>,
			) as unknown as Record<string, number>,
		} as unknown as ClosingStockFormData,
	})

	// 3. Form Pembelian Bensin (Refill/Purchase)
	const {
		register: registerPurchase,
		handleSubmit: handleSubmitPurchase,
		reset: resetPurchase,
		watch: watchPurchase,
		setValue: setValuePurchase,
		formState: { errors: errorsPurchase },
	} = useForm<PurchaseFormData>({
		resolver: zodResolver(purchaseSchema),
		defaultValues: {
			liters: '',
			cost: '',
			target: 'jerigen',
		} as unknown as PurchaseFormData,
	})

	// 4. Form Kemas / Tuang Jerigen ke Botol
	const {
		register: registerPour,
		handleSubmit: handleSubmitPour,
		reset: resetPour,
		formState: { errors: errorsPour },
	} = useForm<PourFormData>({
		resolver: zodResolver(pourSchema),
		defaultValues: {
			bottleId: products[0]?.id || 'p1',
			quantity: '',
		} as unknown as PourFormData,
	})

	// Automatic "Uang Keluar" calculation based on catalog cost price
	const watchedTarget = watchPurchase('target')
	const watchedLiters = watchPurchase('liters')

	useEffect(() => {
		if (watchedTarget) {
			const product =
				watchedTarget === 'jerigen' ? products[0] : products.find(p => p.id === watchedTarget)

			const cleanLitersStr = String(watchedLiters || '').replace(',', '.')
			const litersNum = parseFloat(cleanLitersStr)

			if (!isNaN(litersNum)) {
				const costPerLiter = product ? product.costPrice / product.volume : 10000
				const totalCost = litersNum * costPerLiter
				setValuePurchase('cost', formatInputNumber(String(Math.round(totalCost))) as any)
			}
		}
	}, [watchedTarget, watchedLiters, products, setValuePurchase])

	// Closing stock form watchers
	const watchedClosing = watchClose('closingStocks')
	const watchedUangAkhir = watchClose('uangAkhir')

	// Dynamic Uang Akhir calculation based on closing stocks inputs
	useEffect(() => {
		if (!activeOpeningStock) return
		if (dirtyFieldsClose.uangAkhir) return // Do not overwrite manual edits

		let totalRevenue = 0
		products.forEach(p => {
			const open = activeOpeningStock[p.id] || 0
			const poured = activePushedBottles[p.id] || 0
			const totalInv = open + poured

			const closeInputVal = watchedClosing ? watchedClosing[p.id] : 0
			const closeInput =
				typeof closeInputVal === 'number' ? closeInputVal : parseFloat(String(closeInputVal)) || 0
			const close = isNaN(closeInput) ? 0 : closeInput
			const sold = Math.max(0, totalInv - close)
			totalRevenue += sold * p.sellingPrice
		})

		const expectedCash = activeCashIn + totalRevenue - activeCashOut
		setValueClose('uangAkhir', formatInputNumber(String(expectedCash)) as any)
	}, [
		watchedClosing,
		activeOpeningStock,
		activePushedBottles,
		activeCashIn,
		activeCashOut,
		products,
		setValueClose,
		dirtyFieldsClose.uangAkhir,
	])

	// Render-level calculations for expected ending cash and cash variance
	let computedRevenue = 0
	if (activeOpeningStock) {
		products.forEach(p => {
			const open = activeOpeningStock[p.id] || 0
			const poured = activePushedBottles[p.id] || 0
			const totalInv = open + poured

			const closeInputVal = watchedClosing ? watchedClosing[p.id] : 0
			const closeInput =
				typeof closeInputVal === 'number' ? closeInputVal : parseFloat(String(closeInputVal)) || 0
			const close = isNaN(closeInput) ? 0 : closeInput
			const sold = Math.max(0, totalInv - close)
			computedRevenue += sold * p.sellingPrice
		})
	}
	const expectedCash = activeOpeningStock ? activeCashIn + computedRevenue - activeCashOut : 0
	const actualCash = parseRupiah(String(watchedUangAkhir || '0'))
	const cashVariance = actualCash - expectedCash

	const onSubmitOpen = (data: OpeningStockFormData) => {
		setOpeningStock(data.date, data.openingStocks, data.uangAwal)
	}

	const onSubmitClose = async (data: ClosingStockFormData) => {
		// Validate note if there is a variance
		const actualCashVal = data.uangAkhir
		const variance = actualCashVal - expectedCash
		if (variance !== 0 && !data.note?.trim()) {
			alert('Harap isi catatan penjelasan selisih kas sebelum menyimpan laporan.')
			return
		}

		setIsSubmitting(true)
		await new Promise(resolve => setTimeout(resolve, 800))
		submitClosingStock(data.closingStocks, data.uangAkhir, data.note)
		setIsSubmitting(false)
		setShowSuccess(true)
		setTimeout(() => {
			setShowSuccess(false)
			router.push('/')
		}, 1500)
	}

	const onSubmitPurchase = (data: PurchaseFormData) => {
		setRefillError(null)
		const res = submitPurchase(data.liters, data.cost, data.target)
		if (!res.success) {
			setRefillError(res.message || 'Gagal menambahkan pembelian')
		} else {
			resetPurchase()
		}
	}

	const onSubmitPour = (data: PourFormData) => {
		setPourError(null)
		const res = pourFuelToBottles(data.bottleId, data.quantity)
		if (!res.success) {
			setPourError(res.message || 'Gagal menuangkan bensin')
		} else {
			resetPour()
		}
	}

	const formatPrice = (val: number) => {
		return formatRupiah(val)
	}

	return (
		<div className="flex flex-col gap-6 pb-8">
			{/* 2. FORM UTAMA LAPORAN SHIFT (STOK AWAL / STOK AKHIR) */}
			<section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
				{showSuccess ? (
					<div className="flex flex-col items-center justify-center py-12 text-green-600 gap-2">
						<div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center animate-bounce">
							<Check className="w-6 h-6" />
						</div>
						<span className="text-sm font-bold">Laporan Berhasil Disimpan!</span>
					</div>
				) : activeOpeningStock === null ? (
					/* ================== FORM STOK AWAL (PAGI) ================== */
					<div>
						<h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide flex items-center gap-1.5">
							☀️ Pagi: Input Stok Awal Hari
						</h2>
						<p className="text-xs text-gray-500 mb-4">
							Masukkan uang awal kasir dan jumlah botol siap jual di rak pada awal hari.
						</p>
						<form onSubmit={handleSubmitOpen(onSubmitOpen)} className="flex flex-col gap-4">
							{/* Tanggal Laporan */}
							<div className="flex flex-col gap-1">
								<label htmlFor="date" className="text-xs font-bold text-gray-700">
									Tanggal Hari Ini
								</label>
								<input
									id="date"
									type="date"
									{...registerOpen('date')}
									className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
								/>
								{errorsOpen.date && (
									<span className="text-[10px] text-red-500 font-semibold mt-0.5">
										{errorsOpen.date.message}
									</span>
								)}
							</div>

							{/* Uang Awal */}
							<div className="flex flex-col gap-1">
								<label htmlFor="uang-awal" className="text-xs font-bold text-gray-700">
									Uang Awal (Cash Awal di Laci)
								</label>
								<input
									id="uang-awal"
									type="text"
									inputMode="numeric"
									{...registerOpen('uangAwal', {
										onChange: e => {
											e.target.value = formatInputNumber(e.target.value)
										},
									})}
									className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
									placeholder="Contoh: 100.000"
								/>
								{errorsOpen.uangAwal && (
									<span className="text-[10px] text-red-500 font-semibold mt-0.5">
										{errorsOpen.uangAwal.message}
									</span>
								)}
							</div>

							{/* Botol Siap Jual */}
							<div className="flex flex-col gap-3">
								<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
									Botol Siap Jual di Rak (Unit)
								</span>
								{products.map(p => (
									<div key={p.id} className="flex justify-between items-center gap-4">
										<label htmlFor={`open-${p.id}`} className="text-xs font-semibold text-gray-700">
											{p.name}
										</label>
										<div className="w-24">
											<input
												id={`open-${p.id}`}
												type="text"
												inputMode="numeric"
												{...registerOpen(`openingStocks.${p.id}`)}
												className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-orange-500"
											/>
										</div>
									</div>
								))}
							</div>

							<button
								type="submit"
								className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2.5 rounded-md transition-colors shadow-sm mt-2"
							>
								Simpan Stok & Uang Awal
							</button>
						</form>
					</div>
				) : (
					/* ================== FORM STOK AKHIR (MALAM) ================== */
					<div className="flex flex-col gap-4">
						{/* Ringkasan Stok Awal Terkunci */}
						<div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2 relative">
							<div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
								<span className="text-xs font-black text-slate-800 uppercase tracking-wide">
									☀️ Stok Awal Tersimpan
								</span>
								<span className="text-[10px] text-slate-500 font-bold">📅 {activeDate}</span>
							</div>
							<div className="text-xs text-slate-600 flex justify-between">
								<span>Uang Awal Kas:</span>
								<span className="font-bold text-slate-800">{formatPrice(activeCashIn)}</span>
							</div>
							<div className="text-xs text-slate-600 flex flex-col gap-0.5">
								<span className="font-semibold text-slate-500 text-[10px] uppercase">
									Stok Awal Botol:
								</span>
								{products.map(p => (
									<div key={p.id} className="flex justify-between pl-2">
										<span>{p.name}:</span>
										<span className="font-bold text-slate-800">
											{activeOpeningStock[p.id] || 0} Unit
										</span>
									</div>
								))}
							</div>
							{/* Button Ubah Stok Awal */}
							<button
								onClick={() => {
									useGasolineStore.setState({ activeOpeningStock: null })
								}}
								className="mt-2 text-[10px] text-center text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 py-1 rounded font-bold transition-all"
							>
								✏️ Ubah Data Pagi (Stok Awal)
							</button>
						</div>

						<div className="border-t border-gray-100 pt-4">
							<h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide flex items-center gap-1.5">
								🌙 Malam: Input Sisa Stok & Uang Akhir
							</h2>
							<p className="text-xs text-gray-500 mb-4">
								Masukkan jumlah uang total hari ini dan sisa botol di akhir hari.
							</p>

							<form onSubmit={handleSubmitClose(onSubmitClose)} className="flex flex-col gap-4">
								{/* 1. Sisa Botol */}
								<div className="flex flex-col gap-3">
									<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
										Botol Sisa Jualan di Rak (Unit)
									</span>
									{products.map(p => (
										<div key={p.id} className="flex justify-between items-center gap-4">
											<label
												htmlFor={`close-${p.id}`}
												className="text-xs font-semibold text-gray-700"
											>
												{p.name}
											</label>
											<div className="w-24">
												<input
													id={`close-${p.id}`}
													type="text"
													inputMode="numeric"
													{...registerClose(`closingStocks.${p.id}`)}
													className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-orange-500"
												/>
											</div>
										</div>
									))}
								</div>

								{/* 2. Input Uang Akhir (Fisik) */}
								<div className="flex flex-col gap-1 mt-2">
									<div className="flex justify-between items-center">
										<label htmlFor="uang-akhir" className="text-xs font-bold text-gray-700">
											Uang Akhir Aktual (Fisik di Laci)
										</label>
										<span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
											Sistem: {formatPrice(expectedCash)}
										</span>
									</div>
									<input
										id="uang-akhir"
										type="text"
										inputMode="numeric"
										{...registerClose('uangAkhir', {
											onChange: e => {
												e.target.value = formatInputNumber(e.target.value)
											},
										})}
										className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
										placeholder="Contoh: 350.000"
									/>
									{errorsClose.uangAkhir && (
										<span className="text-xs text-red-500 font-semibold mt-0.5">
											{errorsClose.uangAkhir.message}
										</span>
									)}
								</div>

								{/* 3. Selisih Kas & Rekonsiliasi Info */}
								{watchedClosing && (
									<div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2.5 mt-2">
										<span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
											📊 Rekonsiliasi Kasir & Selisih Kas
										</span>
										<div className="flex flex-col gap-1.5 text-xs">
											<div className="flex justify-between items-center text-slate-600">
												<span>Uang Awal Kas (Pagi):</span>
												<span className="font-bold text-slate-800">
													{formatPrice(activeCashIn)}
												</span>
											</div>
											<div className="flex justify-between items-center text-slate-600">
												<span>Total Penjualan (Omset):</span>
												<span className="font-bold text-green-600">
													+{formatPrice(computedRevenue)}
												</span>
											</div>
											<div className="flex justify-between items-center text-slate-600">
												<span>Total Belanja Bensin:</span>
												<span className="font-bold text-red-600">
													-{formatPrice(activeCashOut)}
												</span>
											</div>
											<div className="border-t border-slate-200 border-dashed my-1"></div>
											<div className="flex justify-between items-center text-slate-700">
												<span>Uang Teoretis (Sistem):</span>
												<span className="font-bold text-slate-800">
													{formatPrice(expectedCash)}
												</span>
											</div>
											<div className="flex justify-between items-center text-slate-700">
												<span>Uang Fisik (Laci):</span>
												<span className="font-bold text-slate-800">{formatPrice(actualCash)}</span>
											</div>
											<div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-slate-200">
												<span>Selisih Kas:</span>
												<span
													className={
														cashVariance === 0
															? 'text-slate-500'
															: cashVariance > 0
																? 'text-green-600'
																: 'text-red-600'
													}
												>
													{cashVariance === 0
														? 'Seimbang (Balance)'
														: `${cashVariance > 0 ? '+' : ''}${formatPrice(cashVariance)}`}
												</span>
											</div>
										</div>

										{/* Keterangan Selisih Field */}
										{cashVariance !== 0 && (
											<div className="flex flex-col gap-1.5 mt-2 border-t border-slate-200 pt-2.5">
												<label
													htmlFor="closing-note"
													className="text-[10px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1"
												>
													⚠️ Catatan Penjelasan Selisih Kas{' '}
													<span className="text-red-500 font-black">*</span>
												</label>
												<textarea
													id="closing-note"
													rows={2}
													{...registerClose('note')}
													className="w-full px-3 py-2 border border-red-200 rounded-md text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent"
													placeholder="Misalnya: Kembalian kurang Rp1.000, atau sisa minyak di tangki motor kasir."
												/>
											</div>
										)}
									</div>
								)}

								{/* 4. Dynamic Sales Preview */}
								<div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-col gap-2 mt-2">
									<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
										Preview Hasil Penjualan Hari Ini
									</span>
									<div className="flex flex-col gap-2 mt-1">
										{products.map(p => {
											const open = activeOpeningStock[p.id] || 0
											const poured = activePushedBottles[p.id] || 0
											const totalInv = open + poured

											const closeInputVal = watchedClosing ? watchedClosing[p.id] : 0
											const closeInput =
												typeof closeInputVal === 'number'
													? closeInputVal
													: parseFloat(String(closeInputVal)) || 0
											const close = isNaN(closeInput) ? 0 : closeInput
											const sold = Math.max(0, totalInv - close)

											return (
												<div
													key={p.id}
													className="text-xs text-gray-600 flex flex-col border-b border-dashed border-gray-200 pb-1.5 last:border-0 last:pb-0"
												>
													<div className="flex justify-between font-bold text-gray-800">
														<span>{p.name}</span>
														<span className="text-orange-600">{sold} Botol Terjual</span>
													</div>
													<div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
														<span>
															(Awal {open} + Tuang {poured} = {totalInv} unit)
														</span>
														<span>Omset: {formatPrice(sold * p.sellingPrice)}</span>
													</div>
												</div>
											)
										})}
									</div>
								</div>

								<button
									type="submit"
									disabled={isSubmitting}
									className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2.5 rounded-md flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-sm mt-2"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Menyimpan Laporan Akhir...
										</>
									) : (
										'Simpan Laporan Akhir (Tutup Hari)'
									)}
								</button>
							</form>
						</div>
					</div>
				)}
			</section>

			{/* 3. FORM PEMBELIAN HARIAN */}
			<section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
				<h2 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1.5 uppercase">
					<ShoppingCart className="w-4 h-4 text-orange-500" /> ⛽ Catat Pembelian Bensin
				</h2>
				<p className="text-xs text-gray-500 mb-4">
					Catat pembelian bensin hari ini, masukkan ke jerigen bulk atau langsung tuang ke botol.
				</p>

				{refillError && (
					<div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-lg font-semibold mb-3 border border-red-100">
						⚠️ {refillError}
					</div>
				)}

				<form onSubmit={handleSubmitPurchase(onSubmitPurchase)} className="flex flex-col gap-3">
					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1">
							<label htmlFor="purchase-liters" className="text-xs font-semibold text-gray-700">
								Volume Liter
							</label>
							<div className="relative">
								<input
									id="purchase-liters"
									type="text"
									inputMode="decimal"
									{...registerPurchase('liters')}
									className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
								/>
								<span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">L</span>
							</div>
							<span className="text-[8px] text-gray-400 leading-tight">
								*Gunakan titik (.) atau koma (,) untuk desimal (contoh: 9.5 atau 9,5)
							</span>
							{errorsPurchase.liters && (
								<span className="text-[9px] text-red-500 font-semibold">
									{errorsPurchase.liters.message}
								</span>
							)}
						</div>

						<div className="flex flex-col gap-1">
							<label htmlFor="purchase-cost" className="text-xs font-semibold text-gray-700">
								Uang Keluar (Rp)
							</label>
							<input
								id="purchase-cost"
								type="text"
								inputMode="numeric"
								{...registerPurchase('cost', {
									onChange: e => {
										e.target.value = formatInputNumber(e.target.value)
									},
								})}
								className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 font-semibold"
								placeholder="Contoh: 100.000"
							/>
							{errorsPurchase.cost && (
								<span className="text-[9px] text-red-500 font-semibold">
									{errorsPurchase.cost.message}
								</span>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<label htmlFor="purchase-target" className="text-xs font-semibold text-gray-700">
							Tujuan Alokasi Stok
						</label>
						<select
							id="purchase-target"
							{...registerPurchase('target')}
							className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-orange-500"
						>
							<option value="jerigen">Jerigen Bulk (Penyimpanan)</option>
							{products.map(p => (
								<option key={p.id} value={p.id}>
									Langsung Tuang ke {p.name} ({p.volume}L)
								</option>
							))}
						</select>
					</div>

					<button
						type="submit"
						className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm py-2 rounded-md transition-colors"
					>
						Simpan Pembelian Bensin
					</button>
				</form>
			</section>

			{/* 4. FORM PENGEMASAN */}
			{products.length > 0 && (
				<section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
					<h2 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1.5 uppercase">
						<ArrowRightLeft className="w-4 h-4 text-orange-500" /> 🧪 Tuang Bensin ke Botol
					</h2>
					<p className="text-xs text-gray-500 mb-4">
						Tuangkan bensin curah dari tangki jerigen ke dalam botol kemasan siap jual.
					</p>

					{pourError && (
						<div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-lg font-semibold mb-3 border border-red-100">
							⚠️ {pourError}
						</div>
					)}

					<form onSubmit={handleSubmitPour(onSubmitPour)} className="flex flex-col gap-3">
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1">
								<label htmlFor="pour-bottle" className="text-xs font-semibold text-gray-700">
									Pilih Tipe Botol
								</label>
								<select
									id="pour-bottle"
									{...registerPour('bottleId')}
									className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-orange-500"
								>
									{products.map(p => (
										<option key={p.id} value={p.id}>
											{p.name}
										</option>
									))}
								</select>
							</div>

							<div className="flex flex-col gap-1">
								<label htmlFor="pour-qty" className="text-xs font-semibold text-gray-700">
									Jumlah Botol
								</label>
								<input
									id="pour-qty"
									type="text"
									inputMode="numeric"
									{...registerPour('quantity')}
									className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
								/>
								{errorsPour.quantity && (
									<span className="text-[9px] text-red-500 font-semibold">
										{errorsPour.quantity.message}
									</span>
								)}
							</div>
						</div>

						<button
							type="submit"
							className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm py-2 rounded-md transition-colors"
						>
							Mulai Pengisian Botol
						</button>
					</form>
				</section>
			)}
		</div>
	)
}
