"use client";

import React from "react";
import { useGasolineStore } from "@/store/useGasolineStore";
import { formatRupiah } from "@/lib/CurrencyFormatter";
import {
  Landmark,
  ArrowUpRight,
  TrendingUp,
  HelpCircle,
  Inbox,
} from "lucide-react";

export default function DashboardPage() {
  const { products, dailyRecaps, jerigenStock, bottleStock, clearAllRecaps } =
    useGasolineStore();

  // Calculate aggregate metrics
  const totalRevenue = dailyRecaps.reduce(
    (acc, curr) => acc + curr.totalRevenue,
    0,
  );
  const totalCapital = dailyRecaps.reduce(
    (acc, curr) => acc + curr.totalCapital,
    0,
  );
  const totalProfit = dailyRecaps.reduce(
    (acc, curr) => acc + curr.totalNetProfit,
    0,
  );

  const formatCurrency = (value: number) => {
    return formatRupiah(value);
  };

  const dateNow = new Date().toLocaleDateString("id-ID");

  return (
    <div className="flex flex-col gap-4">
      {/* Utama: Stok Botolan Siap Jual */}
      <section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
        <div className="flex justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Inbox className="w-3.5 h-3.5 text-orange-500" /> Stok Botol Siap
            Jual (Utama)
          </h3>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            {dateNow}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center flex flex-col justify-between"
            >
              <span className="text-[10px] text-gray-400 font-bold block leading-tight">
                {p.name}
              </span>
              <span className="text-lg font-black text-slate-800 block mt-1.5">
                {bottleStock[p.id] || 0}
              </span>
              <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">
                Botol
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Cadangan: Stok Tangki Jerigen */}
      <section className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Stok Tangki Cadangan (Jerigen)
        </h3>
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xl font-black text-gray-900">
            {jerigenStock.toFixed(1)} L
          </span>
          <span className="text-xs text-gray-400 font-semibold">
            Kapasitas Maks: 50.0 L
          </span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-orange-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (jerigenStock / 50) * 100)}%` }}
          />
        </div>
      </section>

      {/* Grid Summary Metrics */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Total Pendapatan (Omset)
          </span>
          <div className="mt-2">
            <span className="text-base font-extrabold text-gray-900 block truncate">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="text-[9px] text-green-600 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-2.5 h-2.5" /> Penjualan kotor
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Keuntungan Bersih (Profit)
          </span>
          <div className="mt-2">
            <span className="text-base font-extrabold text-green-600 block truncate">
              {formatCurrency(totalProfit)}
            </span>
            <span className="text-[9px] text-green-600 font-bold flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> Margin langsung
            </span>
          </div>
        </div>
      </section>

      {/* Daily Recaps History */}
      <section className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Riwayat Rekap Harian
          </h2>
          {dailyRecaps.length > 0 && (
            <button
              onClick={clearAllRecaps}
              className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded transition-colors"
            >
              Reset Data
            </button>
          )}
        </div>

        {dailyRecaps.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">
                Belum ada rekap yang tercatat
              </p>
              <p className="text-xs text-gray-400 mt-0.5 px-4">
                Ketuk tab **Stok Opname** untuk memasukkan perhitungan fisik
                stok dan mencatat riwayat transaksi.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {dailyRecaps.map((recap) => (
              <div
                key={recap.id}
                className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-black text-gray-800">
                    📅 {recap.date}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {recap.totalSoldLiters.toFixed(1)} L Terjual
                  </span>
                </div>
                <div className="grid grid-cols-3 text-center gap-1 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                      Omset
                    </span>
                    <span className="text-xs font-bold text-gray-800">
                      {formatCurrency(recap.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                      Modal
                    </span>
                    <span className="text-xs font-bold text-gray-800">
                      {formatCurrency(recap.totalCapital)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                      Profit
                    </span>
                    <span className="text-xs font-bold text-green-600">
                      {formatCurrency(recap.totalNetProfit)}
                    </span>
                  </div>
                </div>
                {/* Cash Flow Summary */}
                <div className="bg-slate-50 px-2 py-1.5 rounded flex items-center justify-between mt-1 text-[10px] text-gray-600 font-semibold">
                  <div className="flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-gray-400" />
                    <span>Rekap Buku Kas:</span>
                  </div>
                  <div className="flex gap-2">
                    <span>
                      Masuk: {formatCurrency(recap.cashSummary.cashIn)}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>
                      Keluar: {formatCurrency(recap.cashSummary.cashOut)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
