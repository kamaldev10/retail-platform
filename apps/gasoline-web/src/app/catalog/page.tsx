'use client'

import { useState } from 'react'
import { useGasolineStore } from '@/store/useGasolineStore'
import { ProductDefinition } from '@/lib/calculations'
import { formatRupiah, formatInputNumber, parseRupiah } from '@/lib/CurrencyFormatter'
import { Edit2, Trash2, X, Package, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CatalogPage() {
	const { products, addProduct, updateProduct, deleteProduct } = useGasolineStore()

	const [editingProductId, setEditingProductId] = useState<string | null>(null)
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const [catName, setCatName] = useState('')
	const [catVolume, setCatVolume] = useState('')
	const [catCost, setCatCost] = useState('')
	const [catSell, setCatSell] = useState('')

	const resetCatalogForm = () => {
		setEditingProductId(null)
		setCatName('')
		setCatVolume('')
		setCatCost('')
		setCatSell('')
	}

	const handleSaveCatalogProduct = (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)

		const volumeNum = parseFloat(catVolume)
		const costNum = parseRupiah(catCost)
		const sellNum = parseRupiah(catSell)

		if (!catName.trim()) {
			toast.error('Nama produk wajib diisi.')
			setIsSubmitting(false)
			return
		}
		if (isNaN(volumeNum) || volumeNum <= 0) {
			toast.error('Volume harus berupa angka lebih besar dari 0.')
			setIsSubmitting(false)
			return
		}
		if (isNaN(costNum) || costNum < 0) {
			toast.error('Harga Beli harus berupa angka positif.')
			setIsSubmitting(false)
			return
		}
		if (isNaN(sellNum) || sellNum < 0) {
			toast.error('Harga Jual harus berupa angka positif.')
			setIsSubmitting(false)
			return
		}

		const payload = {
			name: catName.trim(),
			volume: volumeNum,
			costPrice: costNum,
			sellingPrice: sellNum,
			margin: sellNum - costNum,
		}

		const res = editingProductId
			? updateProduct(editingProductId, payload)
			: addProduct({ id: `p-${Date.now()}`, ...payload })

		if (!res.success) {
			toast.error(res.message || 'Gagal menyimpan produk.')
			setIsSubmitting(false)
			return
		}

		toast.success(editingProductId ? 'Produk berhasil diperbarui.' : 'Produk baru ditambahkan.')
		resetCatalogForm()
		setIsSubmitting(false)
	}

	const handleEditClick = (p: ProductDefinition) => {
		setPendingDeleteId(null)
		setEditingProductId(p.id)
		setCatName(p.name)
		setCatVolume(String(p.volume))
		setCatCost(formatInputNumber(p.costPrice))
		setCatSell(formatInputNumber(p.sellingPrice))
	}

	const handleConfirmDelete = (id: string) => {
		const res = deleteProduct(id)
		if (!res.success) {
			toast.error(res.message || 'Gagal menghapus produk.')
			return
		}
		toast.success('Produk berhasil dihapus.')
		setPendingDeleteId(null)
		if (editingProductId === id) resetCatalogForm()
	}

	return (
		<div className="flex flex-col gap-5 pb-8">
			<section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-4">
				<div>
					<h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide flex items-center gap-1.5">
						<Package className="w-4 h-4 text-orange-500" />
						{editingProductId ? 'Edit Detail Produk' : 'Tambah Produk Baru'}
					</h2>
					<p className="text-xs text-gray-500">
						Kelola tipe botol eceran beserta harga beli dan harga jual.
					</p>
				</div>

				<form onSubmit={handleSaveCatalogProduct} className="flex flex-col gap-3.5">
					<div className="flex flex-col gap-1">
						<label htmlFor="cat-name" className="text-xs font-semibold text-gray-700">
							Nama Produk
						</label>
						<input
							id="cat-name"
							type="text"
							placeholder="Misal: Premium 1L"
							value={catName}
							aria-invalid={false}
							onChange={e => setCatName(e.target.value)}
							className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
						/>
					</div>

					<div className="grid grid-cols-3 gap-2">
						<div className="flex flex-col gap-1">
							<label htmlFor="cat-volume" className="text-xs font-semibold text-gray-700">
								Volume (L)
							</label>
							<input
								id="cat-volume"
								type="text"
								inputMode="decimal"
								placeholder="1.0"
								value={catVolume}
								onChange={e => setCatVolume(e.target.value)}
								className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-orange-500"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label htmlFor="cat-cost" className="text-xs font-semibold text-gray-700">
								Harga Beli
							</label>
							<input
								id="cat-cost"
								type="text"
								inputMode="numeric"
								placeholder="10.000"
								value={catCost}
								onChange={e => setCatCost(formatInputNumber(e.target.value))}
								className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-orange-500"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label htmlFor="cat-sell" className="text-xs font-semibold text-gray-700">
								Harga Jual
							</label>
							<input
								id="cat-sell"
								type="text"
								inputMode="numeric"
								placeholder="12.000"
								value={catSell}
								onChange={e => setCatSell(formatInputNumber(e.target.value))}
								className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-orange-500"
							/>
						</div>
					</div>

					<div className="flex gap-2 mt-1">
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm py-2 rounded-md transition-colors flex items-center justify-center gap-2"
						>
							{isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
							{editingProductId ? 'Simpan Pembaruan' : 'Tambah Produk'}
						</button>
						{editingProductId && (
							<button
								type="button"
								onClick={resetCatalogForm}
								className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-sm flex items-center justify-center"
								aria-label="Batal edit produk"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>
				</form>
			</section>

			<section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-3">
				<h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
					Daftar Produk Terdaftar
				</h3>
				<div className="flex flex-col gap-2">
					{products.map(p => (
						<div
							key={p.id}
							className="flex flex-col gap-2 p-3 border border-gray-100 rounded-lg hover:bg-slate-50 transition-colors"
						>
							<div className="flex items-center justify-between">
								<div className="flex flex-col gap-0.5">
									<span className="text-xs font-bold text-slate-800">{p.name}</span>
									<span className="text-[10px] text-gray-400 font-semibold">
										Volume: {p.volume}L | Beli: {formatRupiah(p.costPrice)} | Jual:{' '}
										{formatRupiah(p.sellingPrice)}
									</span>
									<span className="text-[9px] text-green-600 font-black">
										Margin: {formatRupiah(p.margin)} / botol
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<button
										type="button"
										onClick={() => handleEditClick(p)}
										className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors"
										title="Edit Produk"
										aria-label={`Edit ${p.name}`}
									>
										<Edit2 className="w-3.5 h-3.5" />
									</button>
									<button
										type="button"
										onClick={() => setPendingDeleteId(p.id)}
										className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
										title="Hapus Produk"
										aria-label={`Hapus ${p.name}`}
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>

							{pendingDeleteId === p.id && (
								<div className="flex flex-col gap-2 bg-red-50 border border-red-100 rounded-md p-2">
									<p className="text-[10px] text-red-700 font-semibold">
										Hapus produk ini? Stok botol terkait ikut terhapus dari state.
									</p>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => handleConfirmDelete(p.id)}
											className="flex-1 text-[10px] font-bold bg-red-600 text-white py-1.5 rounded-md"
										>
											Ya, Hapus
										</button>
										<button
											type="button"
											onClick={() => setPendingDeleteId(null)}
											className="flex-1 text-[10px] font-bold bg-white text-slate-600 border border-slate-200 py-1.5 rounded-md"
										>
											Batal
										</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			</section>
		</div>
	)
}
