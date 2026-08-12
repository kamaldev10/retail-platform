'use client'

import { useEffect, useState } from 'react'
import { useGasolineStore } from '@/store/useGasolineStore'
import { ProductDefinition } from '@/lib/calculations'
import { formatRupiah, formatInputNumber, parseRupiah } from '@/lib/CurrencyFormatter'
import { Edit2, Trash2, X, Package, Loader2, Plus, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function CatalogPage() {
	const { products, addProduct, updateProduct, deleteProduct, fetchProductsFromCloud } =
		useGasolineStore()

	const [editingProductId, setEditingProductId] = useState<string | null>(null)
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const [catName, setCatName] = useState('')
	const [catVolume, setCatVolume] = useState('')
	const [catCost, setCatCost] = useState('')
	const [catSell, setCatSell] = useState('')

	useEffect(() => {
		fetchProductsFromCloud()
	}, [fetchProductsFromCloud])

	const resetCatalogForm = () => {
		setEditingProductId(null)
		setCatName('')
		setCatVolume('')
		setCatCost('')
		setCatSell('')
	}

	const handleSaveCatalogProduct = async (e: React.FormEvent) => {
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
			? await updateProduct(editingProductId, payload)
			: await addProduct({ id: `p-${Date.now()}`, ...payload })

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

	const handleConfirmDelete = async (id: string) => {
		const res = await deleteProduct(id)
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
			{/* Form Card (Tambah / Edit Produk) */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-1.5 text-slate-900">
							<Package className="w-4 h-4 text-orange-500" />
							<span>{editingProductId ? 'Edit Detail Produk' : 'Tambah Produk Baru'}</span>
						</CardTitle>
						<Badge variant="orange">{products.length} Varian Produk</Badge>
					</div>
					<CardDescription>
						Kelola tipe botol kemasan bensin eceran beserta harga modal dan harga jual.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSaveCatalogProduct} className="flex flex-col gap-3.5">
						<div className="flex flex-col gap-1">
							<label htmlFor="cat-name" className="text-xs font-bold text-slate-700">
								Nama Produk / Varian
							</label>
							<input
								id="cat-name"
								type="text"
								placeholder="Misal: Premium 1L"
								value={catName}
								onChange={e => setCatName(e.target.value)}
								className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-500"
							/>
						</div>

						<div className="grid grid-cols-3 gap-2">
							<div className="flex flex-col gap-1">
								<label htmlFor="cat-volume" className="text-xs font-bold text-slate-700">
									Volume (L)
								</label>
								<input
									id="cat-volume"
									type="text"
									inputMode="decimal"
									placeholder="1.0"
									value={catVolume}
									onChange={e => setCatVolume(e.target.value)}
									className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-orange-500"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label htmlFor="cat-cost" className="text-xs font-bold text-slate-700">
									Harga Modal
								</label>
								<input
									id="cat-cost"
									type="text"
									inputMode="numeric"
									placeholder="10.000"
									value={catCost}
									onChange={e => setCatCost(formatInputNumber(e.target.value))}
									className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-orange-500 font-mono"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label htmlFor="cat-sell" className="text-xs font-bold text-slate-700">
									Harga Jual
								</label>
								<input
									id="cat-sell"
									type="text"
									inputMode="numeric"
									placeholder="12.000"
									value={catSell}
									onChange={e => setCatSell(formatInputNumber(e.target.value))}
									className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-orange-500 font-mono"
								/>
							</div>
						</div>

						<div className="flex gap-2 pt-1">
							<Button
								type="submit"
								variant="orange"
								size="lg"
								disabled={isSubmitting}
								className="flex-1"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin mr-1.5" />
										<span>Menyimpan...</span>
									</>
								) : editingProductId ? (
									<>
										<CheckCircle className="w-4 h-4 mr-1.5" />
										<span>Simpan Pembaruan</span>
									</>
								) : (
									<>
										<Plus className="w-4 h-4 mr-1.5" />
										<span>Tambah Produk</span>
									</>
								)}
							</Button>

							{editingProductId && (
								<Button
									type="button"
									variant="outline"
									onClick={resetCatalogForm}
									aria-label="Batal edit produk"
								>
									<X className="w-4 h-4" />
								</Button>
							)}
						</div>
					</form>
				</CardContent>
			</Card>

			{/* List Section */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
						Daftar Produk Terdaftar
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-2.5">
						{products.map(p => (
							<div
								key={p.id}
								className="flex flex-col gap-2 p-3.5 border border-slate-100 rounded-xl bg-white hover:bg-slate-50/80 transition-colors shadow-sm"
							>
								<div className="flex items-center justify-between">
									<div className="flex flex-col gap-1">
										<span className="text-xs font-extrabold text-slate-900">{p.name}</span>
										<div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
											<span>
												Vol: <strong className="text-slate-800 font-mono">{p.volume}L</strong>
											</span>
											<span>•</span>
											<span>
												Beli:{' '}
												<strong className="text-slate-800 font-mono">
													{formatRupiah(p.costPrice)}
												</strong>
											</span>
											<span>•</span>
											<span>
												Jual:{' '}
												<strong className="text-slate-800 font-mono">
													{formatRupiah(p.sellingPrice)}
												</strong>
											</span>
										</div>
										<span className="text-[10px] font-extrabold text-emerald-600 font-mono">
											Margin: {formatRupiah(p.margin)} / botol
										</span>
									</div>

									<div className="flex items-center gap-1">
										<button
											type="button"
											onClick={() => handleEditClick(p)}
											className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
											title="Edit Produk"
											aria-label={`Edit ${p.name}`}
										>
											<Edit2 className="w-4 h-4" />
										</button>
										<button
											type="button"
											onClick={() => setPendingDeleteId(p.id)}
											className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											title="Hapus Produk"
											aria-label={`Hapus ${p.name}`}
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Modal Dialog Confirm Hapus Produk */}
			{pendingDeleteId && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<Card className="w-full max-w-sm shadow-2xl">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<AlertTriangle className="w-4 h-4 text-red-500" /> Hapus Produk Katalog?
							</CardTitle>
							<CardDescription>
								Apakah Anda yakin ingin menghapus produk ini dari katalog? Perubahan ini akan
								mempengaruhi persediaan stok.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex justify-end gap-2 pt-2">
							<Button variant="outline" onClick={() => setPendingDeleteId(null)}>
								Batal
							</Button>
							<Button variant="destructive" onClick={() => handleConfirmDelete(pendingDeleteId)}>
								Ya, Hapus
							</Button>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
