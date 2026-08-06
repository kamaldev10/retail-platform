'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { salaryPaymentSchema, SalaryPaymentFormData } from '@/lib/schemas/salary'
import { useGasolineStore } from '@/store/useGasolineStore'
import { formatRupiah, formatInputNumber } from '@/lib/CurrencyFormatter'
import { Users, PlusCircle, CheckCircle, AlertCircle, Calendar, Wallet } from 'lucide-react'

export default function SalaryPage() {
	const { salaryPayments, addSalaryPayment, fetchSalaryFromCloud } = useGasolineStore()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
		null,
	)

	useEffect(() => {
		fetchSalaryFromCloud()
	}, [fetchSalaryFromCloud])

	const today = new Date().toISOString().split('T')[0]

	const {
		register,
		handleSubmit,
		setValue,
		reset,
		formState: { errors },
	} = useForm<SalaryPaymentFormData>({
		resolver: zodResolver(salaryPaymentSchema),
		defaultValues: {
			date: today,
			weekLabel: '',
			amount: 0,
			recipient: '',
			note: '',
		},
	})

	const onSubmit = async (data: SalaryPaymentFormData) => {
		setIsSubmitting(true)
		setFeedback(null)

		const result = await addSalaryPayment({
			date: data.date,
			weekLabel: data.weekLabel || undefined,
			amount: data.amount,
			recipient: data.recipient || undefined,
			note: data.note || undefined,
		})

		setIsSubmitting(false)

		if (result.success) {
			setFeedback({
				type: 'success',
				message: result.message || 'Pembayaran gaji berhasil dicatat',
			})
			reset({
				date: today,
				weekLabel: '',
				amount: 0,
				recipient: '',
				note: '',
			})
		} else {
			setFeedback({
				type: 'error',
				message: result.message || 'Gagal menyimpan data gaji',
			})
		}
	}

	const totalSalaryPaid = salaryPayments.reduce((acc, curr) => acc + curr.amount, 0)

	return (
		<div className="flex flex-col gap-4 pb-20">
			{/* Header Card */}
			<section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
						<Users className="w-5 h-5 text-orange-500" /> Pembayaran Gaji Karyawan
					</h1>
				</div>
				<div className="flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-100 mt-1">
					<div className="flex items-center gap-2">
						<Wallet className="w-4 h-4 text-orange-600" />
						<span className="text-xs font-semibold text-orange-900">Total Gaji Terbayar</span>
					</div>
					<span className="text-sm font-extrabold text-orange-700">
						{formatRupiah(totalSalaryPaid)}
					</span>
				</div>
			</section>

			{/* Form Card */}
			<section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-3">
				<h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
					<PlusCircle className="w-4 h-4 text-orange-500" /> Catat Pembayaran Gaji Baru
				</h2>

				{feedback && (
					<div
						className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
							feedback.type === 'success'
								? 'bg-green-50 text-green-700 border border-green-200'
								: 'bg-red-50 text-red-700 border border-red-200'
						}`}
					>
						{feedback.type === 'success' ? (
							<CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
						) : (
							<AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
						)}
						<span>{feedback.message}</span>
					</div>
				)}

				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
					{/* Tanggal */}
					<div className="flex flex-col gap-1">
						<label htmlFor="salary-date" className="text-xs font-bold text-gray-700">
							Tanggal Pembayaran
						</label>
						<input
							id="salary-date"
							type="date"
							{...register('date')}
							aria-invalid={!!errors.date}
							aria-describedby={errors.date ? 'salary-date-error' : undefined}
							className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
						/>
						{errors.date && (
							<span id="salary-date-error" className="text-[10px] text-red-500 font-semibold">
								{errors.date.message}
							</span>
						)}
					</div>

					{/* Label Minggu */}
					<div className="flex flex-col gap-1">
						<label htmlFor="salary-week" className="text-xs font-bold text-gray-700">
							Keterangan Minggu (Opsional)
						</label>
						<input
							id="salary-week"
							type="text"
							placeholder="Contoh: Minggu ke-4 Juli 2026"
							{...register('weekLabel')}
							className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
						/>
					</div>

					{/* Nominal Gaji */}
					<div className="flex flex-col gap-1">
						<label htmlFor="salary-amount" className="text-xs font-bold text-gray-700">
							Nominal Gaji (Rp)
						</label>
						<input
							id="salary-amount"
							type="text"
							placeholder="0"
							onChange={e => {
								const raw = e.target.value
								const formatted = formatInputNumber(raw)
								e.target.value = formatted
								setValue('amount', formatted as any)
							}}
							aria-invalid={!!errors.amount}
							aria-describedby={errors.amount ? 'salary-amount-error' : undefined}
							className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
						/>
						{errors.amount && (
							<span id="salary-amount-error" className="text-[10px] text-red-500 font-semibold">
								{errors.amount.message}
							</span>
						)}
					</div>

					{/* Penerima */}
					<div className="flex flex-col gap-1">
						<label htmlFor="salary-recipient" className="text-xs font-bold text-gray-700">
							Penerima Gaji (Opsional)
						</label>
						<input
							id="salary-recipient"
							type="text"
							placeholder="Nama karyawan / Staff shift"
							{...register('recipient')}
							className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
						/>
					</div>

					{/* Catatan */}
					<div className="flex flex-col gap-1">
						<label htmlFor="salary-note" className="text-xs font-bold text-gray-700">
							Catatan (Opsional)
						</label>
						<input
							id="salary-note"
							type="text"
							placeholder="Catatan tambahan..."
							{...register('note')}
							className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
						/>
					</div>

					{/* Submit */}
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-3 rounded-lg shadow-sm transition-colors disabled:opacity-50 mt-1"
					>
						{isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran Gaji'}
					</button>
				</form>
			</section>

			{/* Riwayat Gaji */}
			<section className="flex flex-col gap-2">
				<h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
					Riwayat Pembayaran Gaji
				</h2>

				{salaryPayments.length === 0 ? (
					<div className="bg-white p-6 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
						Belum ada catatan pembayaran gaji.
					</div>
				) : (
					<div className="flex flex-col gap-2.5">
						{salaryPayments.map(item => (
							<div
								key={item.id}
								className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-1.5"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
										<Calendar className="w-3.5 h-3.5 text-orange-500" />
										<span>{item.date}</span>
										{item.weekLabel && (
											<span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-semibold border border-orange-100">
												{item.weekLabel}
											</span>
										)}
									</div>
									<span className="text-xs font-extrabold text-red-600 font-mono">
										-{formatRupiah(item.amount)}
									</span>
								</div>

								{(item.recipient || item.note) && (
									<div className="text-[11px] text-gray-600 flex flex-col gap-0.5 pt-1 border-t border-gray-100">
										{item.recipient && (
											<div>
												<span className="font-semibold text-gray-500">Penerima: </span>
												<span>{item.recipient}</span>
											</div>
										)}
										{item.note && (
											<div>
												<span className="font-semibold text-gray-500">Catatan: </span>
												<span>{item.note}</span>
											</div>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	)
}
