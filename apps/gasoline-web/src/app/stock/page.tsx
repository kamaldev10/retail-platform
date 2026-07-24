"use client";

import React, { useState, useEffect } from "react";
import { useGasolineStore } from "@/store/useGasolineStore";
import { ProductDefinition } from "@/lib/calculations";
import {
  formatRupiah,
  formatInputNumber,
  parseRupiah,
} from "@/lib/CurrencyFormatter";
import {
  Check,
  Edit2,
  Trash2,
  Sliders,
  Settings,
  X,
  Package,
} from "lucide-react";

export default function StockPage() {
  const {
    products,
    jerigenStock,
    bottleStock,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStocksDirectly,
    fetchRecapsFromCloud,
  } = useGasolineStore();

  const [activeTab, setActiveTab] = useState<"adjust" | "catalog">("adjust");

  // Catalog CRUD States
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogSuccess, setCatalogSuccess] = useState<string | null>(null);

  // Catalog Form Fields
  const [catId, setCatId] = useState("");
  const [catName, setCatName] = useState("");
  const [catVolume, setCatVolume] = useState("");
  const [catCost, setCatCost] = useState("");
  const [catSell, setCatSell] = useState("");

  // Stock Direct Adjustment States
  const [adjJerigen, setAdjJerigen] = useState(String(jerigenStock));
  const [adjBottles, setAdjBottles] = useState<Record<string, string>>({});
  const [adjSuccess, setAdjSuccess] = useState(false);

  // Initialize and keep forms synced when products or stock update
  useEffect(() => {
    setAdjJerigen(String(jerigenStock));
    const initialBottles: Record<string, string> = {};
    products.forEach((p) => {
      initialBottles[p.id] = String(bottleStock[p.id] || 0);
    });
    setAdjBottles(initialBottles);
  }, [products, jerigenStock, bottleStock]);
  useEffect(() => {
    fetchRecapsFromCloud();
  }, [fetchRecapsFromCloud]);

  // CRUD Product Handlers
  const handleSaveCatalogProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setCatalogError(null);
    setCatalogSuccess(null);

    const volumeNum = parseFloat(catVolume);
    const costNum = parseRupiah(catCost);
    const sellNum = parseRupiah(catSell);

    if (!catName.trim()) {
      setCatalogError("Nama produk wajib diisi.");
      return;
    }
    if (isNaN(volumeNum) || volumeNum <= 0) {
      setCatalogError("Volume harus berupa angka lebih besar dari 0.");
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      setCatalogError("Harga Beli harus berupa angka positif.");
      return;
    }
    if (isNaN(sellNum) || sellNum < 0) {
      setCatalogError("Harga Jual harus berupa angka positif.");
      return;
    }

    if (editingProductId) {
      const res = updateProduct(editingProductId, {
        name: catName,
        volume: volumeNum,
        costPrice: costNum,
        sellingPrice: sellNum,
        margin: sellNum - costNum,
      });
      if (res.success) {
        setCatalogSuccess("Produk berhasil diperbarui!");
        resetCatalogForm();
      } else {
        setCatalogError(res.message || "Gagal memperbarui produk.");
      }
    } else {
      const generatedId = `p-${Date.now()}`;
      const res = addProduct({
        id: generatedId,
        name: catName,
        volume: volumeNum,
        costPrice: costNum,
        sellingPrice: sellNum,
        margin: sellNum - costNum,
      });
      if (res.success) {
        setCatalogSuccess("Produk baru berhasil ditambahkan!");
        resetCatalogForm();
      } else {
        setCatalogError(res.message || "Gagal menambahkan produk.");
      }
    }
  };

  const resetCatalogForm = () => {
    setEditingProductId(null);
    setCatId("");
    setCatName("");
    setCatVolume("");
    setCatCost("");
    setCatSell("");
  };

  const handleEditClick = (p: ProductDefinition) => {
    setEditingProductId(p.id);
    setCatId(p.id);
    setCatName(p.name);
    setCatVolume(String(p.volume));
    setCatCost(formatInputNumber(p.costPrice));
    setCatSell(formatInputNumber(p.sellingPrice));
  };

  const handleDeleteClick = (id: string) => {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus produk ini? Stok produk terkait juga akan ikut terhapus.",
      )
    ) {
      const res = deleteProduct(id);
      if (res.success) {
        setCatalogSuccess("Produk berhasil dihapus.");
      } else {
        setCatalogError(res.message || "Gagal menghapus produk.");
      }
    }
  };

  // Direct Stock Adjust Handler
  const handleSaveAdjustments = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjSuccess(false);

    const jerigenVal = parseFloat(adjJerigen);
    if (isNaN(jerigenVal) || jerigenVal < 0 || jerigenVal > 50) {
      alert("Stok jerigen harus berupa angka positif antara 0 sampai 50L.");
      return;
    }

    const nextBottles: Record<string, number> = {};
    for (const p of products) {
      const val = parseFloat(adjBottles[p.id] || "0");
      if (isNaN(val) || val < 0) {
        alert(`Stok botol untuk ${p.name} tidak boleh negatif.`);
        return;
      }
      nextBottles[p.id] = val;
    }

    updateStocksDirectly(jerigenVal, nextBottles);
    setAdjSuccess(true);
    setTimeout(() => setAdjSuccess(false), 2000);
  };

  const formatPrice = (val: number) => {
    return formatRupiah(val);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* NAVIGATION TABS FOR CRUD */}
      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          onClick={() => setActiveTab("adjust")}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "adjust"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Stok
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "catalog"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Katalog
        </button>
      </div>
      {activeTab === "adjust" && (
        <section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-orange-500" /> Penyesuaian Stok
              Langsung (CRUD)
            </h2>
            <p className="text-xs text-gray-500">
              Opsi darurat untuk langsung mengubah angka fisik stok jerigen dan
              botol secara instan tanpa alur kalkulasi shift.
            </p>
          </div>

          {adjSuccess && (
            <div className="bg-green-50 text-green-700 text-xs p-2.5 rounded-lg font-bold border border-green-100 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Stok berhasil disesuaikan secara
              langsung!
            </div>
          )}

          <form
            onSubmit={handleSaveAdjustments}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-3">
              <label
                htmlFor="adj-jerigen"
                className="text-xs font-bold text-gray-700"
              >
                Stok Tangki Jerigen (Liters)
              </label>
              <div className="relative w-32">
                <input
                  id="adj-jerigen"
                  type="text"
                  value={adjJerigen}
                  onChange={(e) => setAdjJerigen(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold focus:ring-2 focus:ring-orange-500 text-center"
                />
                <span className="absolute right-3 top-2 text-[10px] text-gray-400 font-bold">
                  L
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                Sesuaikan Stok Botol Siap Jual
              </span>
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center gap-4"
                >
                  <label
                    htmlFor={`adj-${p.id}`}
                    className="text-xs font-semibold text-gray-700"
                  >
                    {p.name} ({p.volume}L)
                  </label>
                  <div className="w-24">
                    <input
                      id={`adj-${p.id}`}
                      type="text"
                      inputMode="numeric"
                      value={adjBottles[p.id] || "0"}
                      onChange={(e) =>
                        setAdjBottles({ ...adjBottles, [p.id]: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center font-semibold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2 rounded-md transition-colors shadow-sm mt-2"
            >
              Simpan Perubahan Stok Fisik
            </button>
          </form>
        </section>
      )}

      {/* ================== TAB: CATALOG CRUD (CRUD PRODUK) ================== */}
      {activeTab === "catalog" && (
        <div className="flex flex-col gap-5">
          {/* Catalog editor form */}
          <section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-4 h-4 text-orange-500" />{" "}
                {editingProductId ? "Edit Detail Produk" : "Tambah Produk Baru"}
              </h2>
              <p className="text-xs text-gray-500">
                Kelola tipe botol bensin eceran yang dijual beserta harga beli
                dan harga jualnya.
              </p>
            </div>

            {catalogError && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-lg font-semibold border border-red-100">
                ⚠️ {catalogError}
              </div>
            )}
            {catalogSuccess && (
              <div className="bg-green-50 text-green-700 text-xs p-2.5 rounded-lg font-semibold border border-green-100">
                🎉 {catalogSuccess}
              </div>
            )}

            <form
              onSubmit={handleSaveCatalogProduct}
              className="flex flex-col gap-3.5"
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cat-name"
                  className="text-xs font-semibold text-gray-700"
                >
                  Nama Produk
                </label>
                <input
                  id="cat-name"
                  type="text"
                  placeholder="Misal: Premium 1L, Pertamax 1.2L"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cat-volume"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Volume (Liter)
                  </label>
                  <input
                    id="cat-volume"
                    type="text"
                    placeholder="1.0"
                    value={catVolume}
                    onChange={(e) => setCatVolume(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cat-cost"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Harga Beli (Rp)
                  </label>
                  <input
                    id="cat-cost"
                    type="text"
                    placeholder="10.000"
                    value={catCost}
                    onChange={(e) =>
                      setCatCost(formatInputNumber(e.target.value))
                    }
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cat-sell"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Harga Jual (Rp)
                  </label>
                  <input
                    id="cat-sell"
                    type="text"
                    placeholder="12.000"
                    value={catSell}
                    onChange={(e) =>
                      setCatSell(formatInputNumber(e.target.value))
                    }
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2 rounded-md transition-colors"
                >
                  {editingProductId ? "Simpan Pembaruan" : "Tambah Produk"}
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={resetCatalogForm}
                    className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-sm flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* List of active products */}
          <section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Daftar Produk Terdaftar
            </h3>
            <div className="flex flex-col gap-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      Volume: {p.volume}L | Beli: {formatPrice(p.costPrice)} |
                      Jual: {formatPrice(p.sellingPrice)}
                    </span>
                    <span className="text-[9px] text-green-600 font-black">
                      Margin: {formatPrice(p.margin)} / botol
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditClick(p)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                      title="Edit Produk"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(p.id)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
