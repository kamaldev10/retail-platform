import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DailyRecapResult,
  calculateDailyRecap,
  DailyRecapInput,
  ProductDefinition,
  PRODUCTS,
} from "../lib/calculations";

interface GasolineStore {
  // Offline and network state
  isOnline: boolean;
  syncStatus: "idle" | "syncing" | "success" | "error";

  // Dynamic Product Catalog (CRUD)
  products: ProductDefinition[];

  // Storage Tank (in Liters, max 50L)
  jerigenStock: number;

  // Ready bottle stock on shelf
  bottleStock: Record<string, number>;

  // Current active opname shift state
  activeDate: string;
  activeOpeningStock: Record<string, number> | null;
  activePushedBottles: Record<string, number>;
  activeCashIn: number;
  activeCashOut: number;

  // Historic data
  dailyRecaps: DailyRecapResult[];

  // Methods
  setOnlineStatus: (status: boolean) => void;
  setSyncStatus: (status: "idle" | "syncing" | "success" | "error") => void;

  setOpeningStock: (date: string, stocks: Record<string, number>, uangAwal: number) => void;

  submitPurchase: (
    liters: number,
    cost: number,
    target: string,
  ) => { success: boolean; message?: string };

  pourFuelToBottles: (
    bottleId: string,
    quantity: number,
  ) => { success: boolean; message?: string };

  submitClosingStock: (
    closingStocks: Record<string, number>,
    uangAkhir: number,
  ) => void;

  submitDailyReport: (
    date: string,
    uangAwal: number,
    uangAkhir: number,
    openingStocks: Record<string, number>,
    closingStocks: Record<string, number>,
  ) => void;

  clearAllRecaps: () => void;

  syncWithCloud: () => Promise<{ success: boolean; message?: string }>;

  // CRUD Products Catalog Methods
  addProduct: (product: ProductDefinition) => {
    success: boolean;
    message?: string;
  };
  updateProduct: (
    id: string,
    updated: Omit<ProductDefinition, "id">,
  ) => { success: boolean; message?: string };
  deleteProduct: (id: string) => { success: boolean; message?: string };

  // CRUD Live Stock Methods (Direct Adjustment)
  updateStocksDirectly: (
    jerigen: number,
    bottles: Record<string, number>,
  ) => void;
}

export const useGasolineStore = create<GasolineStore>()(
  persist(
    (set, get) => ({
      isOnline: true,
      syncStatus: "idle",
      products: PRODUCTS,
      jerigenStock: 0,
      bottleStock: {
        p1: 0,
        p2: 0,
        p3: 0,
      },
      activeDate: "",
      activeOpeningStock: null,
      activePushedBottles: {
        p1: 0,
        p2: 0,
        p3: 0,
      },
      activeCashIn: 0,
      activeCashOut: 0,
      dailyRecaps: [],

      setOnlineStatus: (status) => set({ isOnline: status }),

      setSyncStatus: (status) => set({ syncStatus: status }),

      setOpeningStock: (date, stocks, uangAwal) =>
        set({
          activeDate: date,
          activeOpeningStock: stocks,
          bottleStock: { ...stocks }, // Sync current live shelf count
          activePushedBottles: Object.keys(stocks).reduce(
            (acc, key) => {
              acc[key] = 0;
              return acc;
            },
            {} as Record<string, number>,
          ),
          activeCashIn: uangAwal,
          activeCashOut: 0,
        }),

      submitPurchase: (liters, cost, target) => {
        const state = get();

        if (target === "jerigen") {
          const newStock = state.jerigenStock + liters;
          if (newStock > 50) {
            return {
              success: false,
              message: `Gagal: Kapasitas Jerigen tidak boleh melebihi 50L (Maks sisa kapasitas: ${(50 - state.jerigenStock).toFixed(1)}L)`,
            };
          }
          set({
            jerigenStock: newStock,
            activeCashOut: state.activeCashOut + cost,
          });
          return { success: true };
        } else {
          // Direct purchase refill into bottles
          const product = state.products.find((p) => p.id === target);
          if (!product)
            return { success: false, message: "Produk tidak valid" };

          const newUnits = liters / product.volume;
          const updatedPushed = { ...state.activePushedBottles };
          updatedPushed[target] = (updatedPushed[target] || 0) + newUnits;

          set({
            bottleStock: {
              ...state.bottleStock,
              [target]: (state.bottleStock[target] || 0) + newUnits,
            },
            activePushedBottles: updatedPushed,
            activeCashOut: state.activeCashOut + cost,
          });
          return { success: true };
        }
      },

      pourFuelToBottles: (bottleId, quantity) => {
        const state = get();
        const product = state.products.find((p) => p.id === bottleId);
        if (!product) return { success: false, message: "Produk tidak valid" };

        const requiredLiters = quantity * product.volume;
        if (state.jerigenStock < requiredLiters) {
          return {
            success: false,
            message: `Gagal: Stok jerigen tidak mencukupi (Butuh: ${requiredLiters}L, Tersedia: ${state.jerigenStock.toFixed(1)}L)`,
          };
        }

        const updatedPushed = { ...state.activePushedBottles };
        updatedPushed[bottleId] = (updatedPushed[bottleId] || 0) + quantity;

        set({
          jerigenStock: state.jerigenStock - requiredLiters,
          bottleStock: {
            ...state.bottleStock,
            [bottleId]: (state.bottleStock[bottleId] || 0) + quantity,
          },
          activePushedBottles: updatedPushed,
        });

        return { success: true };
      },

      submitClosingStock: (closingStocks, uangAkhir) => {
        const state = get();
        if (!state.activeOpeningStock) return;

        // Calculate sold inventory accounting for poured bottles
        const recapInputs: DailyRecapInput[] = state.products.map((p) => {
          const opening = state.activeOpeningStock![p.id] || 0;
          const poured = state.activePushedBottles[p.id] || 0;
          const closing = closingStocks[p.id] || 0;

          // Total items that should have been sold is: (Opening + Poured) - Closing
          const openingTotal = opening + poured;

          return {
            productId: p.id,
            openingStock: openingTotal,
            closingStock: closing,
          };
        });

        // Calculate total daily recap figures
        const id = `recap-${Date.now()}`;
        const newRecap = calculateDailyRecap(
          id,
          state.activeDate,
          recapInputs,
          uangAkhir, // cashIn is ending cash (Uang Akhir)
          state.activeCashIn + state.activeCashOut, // cashOut is starting cash (Uang Awal) + daily purchases
          state.products,
        );

        // Prepare new bottleStock matching closing, but ensuring any new products not checked are carried forward
        const nextBottleStock = { ...state.bottleStock };
        state.products.forEach((p) => {
          if (p.id in closingStocks) {
            nextBottleStock[p.id] = closingStocks[p.id];
          }
        });

        // Filter out any existing recap for the same date to avoid duplicates
        const filteredRecaps = state.dailyRecaps.filter((r) => r.date !== state.activeDate);

        set({
          dailyRecaps: [newRecap, ...filteredRecaps],
          bottleStock: nextBottleStock,
          activeOpeningStock: null,
          activePushedBottles: state.products.reduce(
            (acc, p) => {
              acc[p.id] = 0;
              return acc;
            },
            {} as Record<string, number>,
          ),
          activeCashIn: 0,
          activeCashOut: 0,
        });
      },

      submitDailyReport: (date, uangAwal, uangAkhir, openingStocks, closingStocks) => {
        const state = get();

        // Calculate sold quantity for each product
        const recapInputs: DailyRecapInput[] = state.products.map((p) => {
          const opening = openingStocks[p.id] || 0;
          const closing = closingStocks[p.id] || 0;

          return {
            productId: p.id,
            openingStock: opening,
            closingStock: closing,
          };
        });

        // Calculate total daily recap figures
        const id = `recap-${Date.now()}`;
        const newRecap = calculateDailyRecap(
          id,
          date,
          recapInputs,
          uangAkhir, // cashIn is the ending cash total (Uang Akhir)
          uangAwal,  // cashOut is the starting cash total (Uang Awal)
          state.products,
        );

        // Update the live bottle stock to match the closing stocks
        const nextBottleStock = { ...state.bottleStock };
        state.products.forEach((p) => {
          if (p.id in closingStocks) {
            nextBottleStock[p.id] = closingStocks[p.id];
          }
        });

        // Filter out any existing recap for the same date to avoid duplicates
        const filteredRecaps = state.dailyRecaps.filter((r) => r.date !== date);

        set({
          dailyRecaps: [newRecap, ...filteredRecaps],
          bottleStock: nextBottleStock,
          activeOpeningStock: null,
          activePushedBottles: state.products.reduce(
            (acc, p) => {
              acc[p.id] = 0;
              return acc;
            },
            {} as Record<string, number>,
          ),
          activeCashIn: 0,
          activeCashOut: 0,
        });
      },

      clearAllRecaps: () =>
        set({
          dailyRecaps: [],
          products: PRODUCTS,
          jerigenStock: 0,
          bottleStock: { p1: 0, p2: 0, p3: 0 },
          activeOpeningStock: null,
          activePushedBottles: { p1: 0, p2: 0, p3: 0 },
          activeCashIn: 0,
          activeCashOut: 0,
        }),

      // CRUD Catalog Methods
      addProduct: (product) => {
        const state = get();
        if (
          state.products.some(
            (p) =>
              p.id === product.id ||
              p.name.toLowerCase() === product.name.toLowerCase(),
          )
        ) {
          return {
            success: false,
            message: "Produk dengan ID atau nama ini sudah ada.",
          };
        }
        set({
          products: [...state.products, product],
          bottleStock: { ...state.bottleStock, [product.id]: 0 },
        });
        return { success: true };
      },

      updateProduct: (id, updated) => {
        const state = get();
        if (!state.products.some((p) => p.id === id)) {
          return { success: false, message: "Produk tidak ditemukan." };
        }
        set({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updated } : p,
          ),
        });
        return { success: true };
      },

      deleteProduct: (id) => {
        const state = get();
        if (!state.products.some((p) => p.id === id)) {
          return { success: false, message: "Produk tidak ditemukan." };
        }
        const updatedBottleStock = { ...state.bottleStock };
        delete updatedBottleStock[id];

        set({
          products: state.products.filter((p) => p.id !== id),
          bottleStock: updatedBottleStock,
        });
        return { success: true };
      },

      // CRUD Live Stock Methods
      updateStocksDirectly: (jerigen, bottles) => {
        set({
          jerigenStock: jerigen,
          bottleStock: bottles,
        });
      },

      syncWithCloud: async () => {
        const state = get();
        if (state.dailyRecaps.length === 0) {
          set({ syncStatus: "success" });
          setTimeout(() => set({ syncStatus: "idle" }), 2000);
          return { success: true };
        }

        set({ syncStatus: "syncing" });
        try {
          const response = await fetch("/api/recap/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ recaps: state.dailyRecaps }),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            set({ syncStatus: "error" });
            return {
              success: false,
              message: data.error || `Error status ${response.status}`,
            };
          }

          set({ syncStatus: "success" });
          setTimeout(() => set({ syncStatus: "idle" }), 3000);
          return { success: true };
        } catch (err) {
          set({ syncStatus: "error" });
          return {
            success: false,
            message: err instanceof Error ? err.message : "Network error",
          };
        }
      },
    }),
    {
      name: "gasoline-platform-offline-store-v3",
    },
  ),
);
