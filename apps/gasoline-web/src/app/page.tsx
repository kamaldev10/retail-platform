"use client";

import React, { useEffect } from "react";
import { useGasolineStore } from "@/store/useGasolineStore";
import { formatRupiah } from "@/lib/CurrencyFormatter";
import {
  Landmark,
  ArrowUpRight,
  TrendingUp,
  HelpCircle,
  Inbox,
} from "lucide-react";

const getIndonesianDayName = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return dayNames[date.getDay()];
  } catch (e) {
    return "-";
  }
};

const formatShortCash = (val: number) => {
  if (val === 0) return "0";
  const absVal = Math.abs(val);
  const thousands = absVal / 1000;
  const formatted = thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1)}k`;
  return val < 0 ? `-${formatted}` : formatted;
};

const getStockVal = (recap: any, prodId: string, field: "closingStock" | "soldQty") => {
  const item = recap.items?.find((i: any) => i.productId === prodId);
  return item ? item[field] : 0;
};

export default function DashboardPage() {
  const { products, dailyRecaps, jerigenStock, bottleStock, clearAllRecaps, fetchRecapsFromCloud } =
    useGasolineStore();

  useEffect(() => {
    fetchRecapsFromCloud();
  }, [fetchRecapsFromCloud]);

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
          <div className="w-full overflow-x-auto rounded-xl border border-gray-150 shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-150 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-2 px-2.5">Hari</th>
                  <th className="py-2 px-2.5">Tgl</th>
                  <th className="py-2 px-2 text-center">Sisa (P1/P2/P3)</th>
                  <th className="py-2 px-2 text-center">Laku (P1/P2/P3)</th>
                  <th className="py-2 px-2 text-right">Uang Awal</th>
                  <th className="py-2 px-2 text-right">Uang Akhir</th>
                  <th className="py-2 px-2 text-right">Sistem</th>
                  <th className="py-2 px-2.5 text-right">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {dailyRecaps.map((recap) => {
                  const dayName = getIndonesianDayName(recap.date);
                  const displayDate = recap.date.split("-").slice(1).join("/"); // MM/DD

                  const sisaP1 = getStockVal(recap, "p1", "closingStock");
                  const sisaP2 = getStockVal(recap, "p2", "closingStock");
                  const sisaP3 = getStockVal(recap, "p3", "closingStock");

                  const lakuP1 = getStockVal(recap, "p1", "soldQty");
                  const lakuP2 = getStockVal(recap, "p2", "soldQty");
                  const lakuP3 = getStockVal(recap, "p3", "soldQty");

                  const uangAwal = recap.uangAwal || 0;
                  const belanja = recap.belanja || 0;
                  const omset = recap.totalRevenue;
                  const expectedCash = uangAwal + omset - belanja;
                  const actualCash = recap.cashSummary.cashIn;
                  const variance = actualCash - expectedCash;

                  return (
                    <tr key={recap.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-2.5 font-bold text-gray-900">{dayName}</td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap text-gray-500">{displayDate}</td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap font-mono text-gray-600">
                        {sisaP1} / {sisaP2} / {sisaP3}
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap font-mono text-orange-600 font-bold">
                        {lakuP1} / {lakuP2} / {lakuP3}
                      </td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap font-mono">{formatShortCash(uangAwal)}</td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap font-mono text-slate-900 font-bold">{formatShortCash(actualCash)}</td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap font-mono text-slate-500">{formatShortCash(expectedCash)}</td>
                      <td className="py-2.5 px-2.5 text-right whitespace-nowrap font-mono">
                        {variance === 0 ? (
                          <span className="text-gray-400">-</span>
                        ) : variance > 0 ? (
                          <span className="text-green-600 font-bold">+{formatShortCash(variance)}</span>
                        ) : (
                          <span className="text-red-500 font-bold">{formatShortCash(variance)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
