'use client';

import React, { useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useGasolineStore } from '@/store/useGasolineStore';

export function OfflineBanner() {
  const { isOnline, syncStatus, setOnlineStatus, syncWithCloud } = useGasolineStore();

  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      syncWithCloud();
    };
    
    const handleOffline = () => {
      setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and trigger sync if online
    const currentOnline = navigator.onLine;
    setOnlineStatus(currentOnline);
    if (currentOnline) {
      syncWithCloud();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus, syncWithCloud]);

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Status Jaringan: Offline"
        className="bg-red-500 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-sm"
      >
        <WifiOff className="w-4 h-4 animate-pulse" />
        <span>Mode Offline — Menyimpan data secara lokal di browser</span>
      </div>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Status Sinkronisasi: Sinkronisasi"
        className="bg-blue-500 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-sm"
      >
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Mengunggah data transaksi ke server utama...</span>
      </div>
    );
  }

  if (syncStatus === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Status Sinkronisasi: Berhasil"
        className="bg-green-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-sm animate-fade-out"
      >
        <CheckCircle className="w-4 h-4" />
        <span>Semua data berhasil disinkronkan dengan database cloud</span>
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <button
        onClick={() => syncWithCloud()}
        role="status"
        aria-live="polite"
        aria-label="Status Sinkronisasi: Gagal. Klik untuk mencoba lagi."
        className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-sm text-center transition-colors"
      >
        <AlertTriangle className="w-4 h-4" />
        <span>Gagal sinkronisasi. Data lokal aman. Ketuk di sini untuk coba lagi.</span>
      </button>
    );
  }

  return null;
}
