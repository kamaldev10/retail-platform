"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGasolineStore } from "@/store/useGasolineStore";
import { ProductDefinition } from "@/lib/calculations";
import {
  formatRupiah,
  formatInputNumber,
  parseRupiah,
} from "@/lib/CurrencyFormatter";
import {
  openingStockSchema,
  OpeningStockFormData,
  closingStockSchema,
  ClosingStockFormData,
  purchaseSchema,
  PurchaseFormData,
  pourSchema,
  PourFormData,
} from "@/lib/schemas/gasoline";
import {
  Check,
  Loader2,
  ArrowRightLeft,
  ShoppingCart,
  Landmark,
  Edit2,
  Trash2,
  Plus,
  Sliders,
  Settings,
  X,
  Package,
} from "lucide-react";

export default function StockPage() {
  const router = useRouter();
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
    addProduct,
    updateProduct,
    deleteProduct,
    updateStocksDirectly,
  } = useGasolineStore();

  const [activeTab, setActiveTab] = useState<"shift" | "adjust" | "catalog">(
    "shift",
  );
  const [refillError, setRefillError] = useState<string | null>(null);
  const [pourError, setPourError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  // 1. Form Stok Awal
  const {
    register: registerOpen,
    handleSubmit: handleSubmitOpen,
    formState: { errors: errorsOpen },
    reset: resetOpen,
  } = useForm<OpeningStockFormData>({
    resolver: zodResolver(openingStockSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      uangAwal: "0",
      openingStocks: products.reduce(
        (acc, p) => {
          acc[p.id] = String(bottleStock[p.id] || 0);
          return acc;
        },
        {} as Record<string, string>,
      ) as unknown as Record<string, number>,
    } as unknown as OpeningStockFormData,
  });

  useEffect(() => {
    resetOpen({
      date: new Date().toISOString().split("T")[0],
      uangAwal: "0",
      openingStocks: products.reduce(
        (acc, p) => {
          acc[p.id] = String(bottleStock[p.id] || 0);
          return acc;
        },
        {} as Record<string, string>,
      ) as unknown as Record<string, number>,
    } as unknown as OpeningStockFormData);
  }, [products, bottleStock, resetOpen]);

  // 2. Form Stok Akhir & Buku Kas
  const {
    register: registerClose,
    handleSubmit: handleSubmitClose,
    watch: watchClose,
    formState: { errors: errorsClose },
  } = useForm<ClosingStockFormData>({
    resolver: zodResolver(closingStockSchema),
    defaultValues: {
      uangAkhir: "0",
      closingStocks: products.reduce(
        (acc, p) => {
          acc[p.id] = "0";
          return acc;
        },
        {} as Record<string, string>,
      ) as unknown as Record<string, number>,
    } as unknown as ClosingStockFormData,
  });

  // 3. Form Pembelian Bensin (Refill/Purchase)
  const {
    register: registerPurchase,
    handleSubmit: handleSubmitPurchase,
    reset: resetPurchase,
    formState: { errors: errorsPurchase },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      liters: "",
      cost: "",
      target: "jerigen",
    } as unknown as PurchaseFormData,
  });

  // 4. Form Kemas / Tuang Jerigen ke Botol
  const {
    register: registerPour,
    handleSubmit: handleSubmitPour,
    reset: resetPour,
    formState: { errors: errorsPour },
  } = useForm<PourFormData>({
    resolver: zodResolver(pourSchema),
    defaultValues: {
      bottleId: products[0]?.id || "p1",
      quantity: "",
    } as unknown as PourFormData,
  });

  const onSubmitOpen = (data: OpeningStockFormData) => {
    setOpeningStock(data.date, data.openingStocks, data.uangAwal);
  };

  const onSubmitClose = async (data: ClosingStockFormData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    submitClosingStock(data.closingStocks, data.uangAkhir);
    setIsSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      router.push("/");
    }, 1500);
  };

  const onSubmitPurchase = (data: PurchaseFormData) => {
    setRefillError(null);
    const res = submitPurchase(data.liters, data.cost, data.target);
    if (!res.success) {
      setRefillError(res.message || "Gagal menambahkan pembelian");
    } else {
      resetPurchase();
    }
  };

  const onSubmitPour = (data: PourFormData) => {
    setPourError(null);
    const res = pourFuelToBottles(data.bottleId, data.quantity);
    if (!res.success) {
      setPourError(res.message || "Gagal menuangkan bensin");
    } else {
      resetPour();
    }
  };

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

  // Live calculations for shift closing preview
  const watchedClosing = watchClose("closingStocks");

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* 1. STATUS INVENTARIS LIVE */}
      <section className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-2xl text-white shadow-md">
        <h2 className="text-xs font-black uppercase tracking-wider opacity-90 mb-2">
          Status Inventaris Terkini
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] opacity-75">
              Stok Jerigen (Penyimpanan)
            </span>
            <span className="text-xl font-extrabold">
              {jerigenStock.toFixed(1)} L
            </span>
            <span className="text-[9px] opacity-75 mt-0.5">
              Kapasitas Maksimal: 50.0 Liter
            </span>
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (jerigenStock / 50) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] opacity-75">
              Stok Botolan Siap Jual
            </span>
            <div className="flex flex-col gap-0.5 mt-1 overflow-y-auto max-h-16">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="text-xs font-semibold flex justify-between"
                >
                  <span>{p.name}:</span>
                  <span className="font-extrabold">
                    {bottleStock[p.id] || 0} unit
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NAVIGATION TABS FOR CRUD & SHIFT OPERATOR */}
      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          onClick={() => setActiveTab("shift")}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "shift"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Transaksi Shift
        </button>
        <button
          onClick={() => setActiveTab("adjust")}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "adjust"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> CRUD Stok
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "catalog"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> CRUD Katalog
        </button>
      </div>

      {activeTab === "shift" && (
        <>
          {/* 2. FORM UTAMA LAPORAN SHIFT (STOK AWAL / STOK AKHIR) */}
          <section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-green-600 gap-2">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center animate-bounce">
                  <Check className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold">
                  Laporan Berhasil Disimpan!
                </span>
              </div>
            ) : activeOpeningStock === null ? (
              /* ================== FORM STOK AWAL (PAGI) ================== */
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide flex items-center gap-1.5">
                  ☀️ Pagi: Input Stok Awal Hari
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Masukkan uang awal kasir dan jumlah botol siap jual di rak
                  pada awal hari.
                </p>
                <form
                  onSubmit={handleSubmitOpen(onSubmitOpen)}
                  className="flex flex-col gap-4"
                >
                  {/* Tanggal Laporan */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="date"
                      className="text-xs font-bold text-gray-700"
                    >
                      Tanggal Hari Ini
                    </label>
                    <input
                      id="date"
                      type="date"
                      {...registerOpen("date")}
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
                    <label
                      htmlFor="uang-awal"
                      className="text-xs font-bold text-gray-700"
                    >
                      Uang Awal (Cash Awal di Laci)
                    </label>
                    <input
                      id="uang-awal"
                      type="text"
                      inputMode="numeric"
                      {...registerOpen("uangAwal", {
                        onChange: (e) => {
                          e.target.value = formatInputNumber(e.target.value);
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
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center gap-4"
                      >
                        <label
                          htmlFor={`open-${p.id}`}
                          className="text-xs font-semibold text-gray-700"
                        >
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
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2 rounded-md transition-colors shadow-sm"
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
                    <span className="text-[10px] text-slate-500 font-bold">
                      📅 {activeDate}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex justify-between">
                    <span>Uang Awal Kas:</span>
                    <span className="font-bold text-slate-800">
                      {formatPrice(activeCashIn)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase">
                      Stok Awal Botol:
                    </span>
                    {products.map((p) => (
                      <div key={p.id} className="flex justify-between pl-2">
                        <span>{p.name}:</span>
                        <span className="font-bold text-slate-855">
                          {activeOpeningStock[p.id] || 0} Unit
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Button Ubah Stok Awal */}
                  <button
                    onClick={() => {
                      useGasolineStore.setState({ activeOpeningStock: null });
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
                    Masukkan jumlah uang total hari ini dan sisa botol di akhir
                    hari.
                  </p>

                  <form
                    onSubmit={handleSubmitClose(onSubmitClose)}
                    className="flex flex-col gap-4"
                  >
                    {/* Input Uang Akhir */}
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="uang-akhir"
                        className="text-xs font-bold text-gray-700"
                      >
                        Uang Akhir (Uang Total di Laci Malam Ini)
                      </label>
                      <input
                        id="uang-akhir"
                        type="text"
                        inputMode="numeric"
                        {...registerClose("uangAkhir", {
                          onChange: (e) => {
                            e.target.value = formatInputNumber(e.target.value);
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

                    {/* Sisa Botol */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        Botol Sisa Jualan di Rak (Unit)
                      </span>
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className="flex justify-between items-center gap-4"
                        >
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

                    {/* Dynamic Preview */}
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-col gap-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        Preview Hasil Penjualan Hari Ini
                      </span>
                      <div className="flex flex-col gap-2 mt-1">
                        {products.map((p) => {
                          const open = activeOpeningStock[p.id] || 0;
                          const poured = activePushedBottles[p.id] || 0;
                          const totalInv = open + poured;

                          const closeInputVal = watchedClosing
                            ? watchedClosing[p.id]
                            : 0;
                          const closeInput =
                            typeof closeInputVal === "number"
                              ? closeInputVal
                              : parseFloat(String(closeInputVal)) || 0;
                          const close = isNaN(closeInput) ? 0 : closeInput;
                          const sold = Math.max(0, totalInv - close);

                          return (
                            <div
                              key={p.id}
                              className="text-xs text-gray-600 flex flex-col border-b border-dashed border-gray-200 pb-1.5 last:border-0 last:pb-0"
                            >
                              <div className="flex justify-between font-bold text-gray-800">
                                <span>{p.name}</span>
                                <span className="text-orange-600">
                                  {sold} Botol Terjual
                                </span>
                              </div>
                              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                <span>
                                  (Awal {open} + Tuang {poured} = {totalInv}{" "}
                                  unit)
                                </span>
                                <span>
                                  Omset: {formatPrice(sold * p.sellingPrice)}
                                </span>
                              </div>
                            </div>
                          );
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
                        "Simpan Laporan Akhir (Tutup Hari)"
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
              <ShoppingCart className="w-4 h-4 text-orange-500" /> ⛽ Catat
              Pembelian Bensin
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Catat pembelian bensin hari ini, masukkan ke jerigen bulk atau
              langsung tuang ke botol.
            </p>

            {refillError && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-lg font-semibold mb-3 border border-red-100">
                ⚠️ {refillError}
              </div>
            )}

            <form
              onSubmit={handleSubmitPurchase(onSubmitPurchase)}
              className="flex flex-col gap-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="purchase-liters"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Volume Liter
                  </label>
                  <div className="relative">
                    <input
                      id="purchase-liters"
                      type="text"
                      inputMode="decimal"
                      {...registerPurchase("liters")}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">
                      L
                    </span>
                  </div>
                  {errorsPurchase.liters && (
                    <span className="text-[9px] text-red-500 font-semibold">
                      {errorsPurchase.liters.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="purchase-cost"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Uang Keluar (Rp)
                  </label>
                  <input
                    id="purchase-cost"
                    type="text"
                    inputMode="numeric"
                    {...registerPurchase("cost", {
                      onChange: (e) => {
                        e.target.value = formatInputNumber(e.target.value);
                      },
                    })}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
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
                <label
                  htmlFor="purchase-target"
                  className="text-xs font-semibold text-gray-700"
                >
                  Tujuan Alokasi Stok
                </label>
                <select
                  id="purchase-target"
                  {...registerPurchase("target")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="jerigen">Jerigen Bulk (Penyimpanan)</option>
                  {products.map((p) => (
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
                <ArrowRightLeft className="w-4 h-4 text-orange-500" /> 🧪 Tuang
                Bensin ke Botol
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Tuangkan bensin curah dari tangki jerigen ke dalam botol kemasan
                siap jual.
              </p>

              {pourError && (
                <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-lg font-semibold mb-3 border border-red-100">
                  ⚠️ {pourError}
                </div>
              )}

              <form
                onSubmit={handleSubmitPour(onSubmitPour)}
                className="flex flex-col gap-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="pour-bottle"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Pilih Tipe Botol
                    </label>
                    <select
                      id="pour-bottle"
                      {...registerPour("bottleId")}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-orange-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="pour-qty"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Jumlah Botol
                    </label>
                    <input
                      id="pour-qty"
                      type="text"
                      inputMode="numeric"
                      {...registerPour("quantity")}
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
        </>
      )}

      {/* ================== TAB: ADJUST STOK DIRECT (CRUD STOK) ================== */}
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
