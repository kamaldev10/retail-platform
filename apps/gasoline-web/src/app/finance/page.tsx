'use client';

import React from 'react';
import { useGasolineStore } from '@/store/useGasolineStore';
import { Landmark, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';
import { formatRupiah } from '@/lib/CurrencyFormatter';

export default function FinancePage() {
  const { dailyRecaps } = useGasolineStore();

  const totalCashIn = dailyRecaps.reduce((acc, curr) => acc + curr.cashSummary.cashIn, 0);
  const totalCashOut = dailyRecaps.reduce((acc, curr) => acc + curr.cashSummary.cashOut, 0);
  const netCashFlow = totalCashIn - totalCashOut;

  const formatCurrency = (value: number) => {
    return formatRupiah(value);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Ledger Overview Card */}
      <section className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 uppercase">
          <Landmark className="w-4 h-4 text-orange-500" /> Ringkasan Arus Kas
        </h2>

        <div className="flex flex-col border-b border-gray-100 pb-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            Total Aliran Kas Bersih
          </span>
          <span
            className={`text-2xl font-black mt-1 ${
              netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(netCashFlow)}
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
                {formatCurrency(totalCashIn)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-600 flex-shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase">Total Uang Keluar</span>
              <span className="text-sm font-bold text-gray-800">
                {formatCurrency(totalCashOut)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Ledger Log Section */}
      <section className="flex flex-col gap-2 mt-2">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Riwayat Aliran Buku Kas
        </h2>

        {dailyRecaps.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
            Belum ada aliran kas. Simpan laporan stok harian untuk membuat catatan arus kas.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {dailyRecaps.map((recap) => (
              <div
                key={recap.id}
                className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <span className="text-xs font-black text-gray-800">
                    📅 {recap.date}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      recap.cashSummary.netFinanceFlow >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {recap.cashSummary.netFinanceFlow >= 0 ? '+' : ''}
                    {formatCurrency(recap.cashSummary.netFinanceFlow)}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                    <span>Uang Diterima:</span>
                  </div>
                  <strong className="text-gray-800">
                    {formatCurrency(recap.cashSummary.cashIn)}
                  </strong>
                </div>

                <div className="flex justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                    <span>Uang Dikeluarkan:</span>
                  </div>
                  <strong className="text-gray-800">
                    {formatCurrency(recap.cashSummary.cashOut)}
                  </strong>
                </div>

                <div className="bg-orange-50/50 p-2 rounded-lg text-[10px] text-orange-800 font-semibold flex items-center gap-1.5 mt-1 border border-orange-100">
                  <Award className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Keuntungan Bersih Terhitung: {formatCurrency(recap.totalNetProfit)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
