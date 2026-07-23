export interface ProductDefinition {
  id: string;
  name: string;
  volume: number; // liters (e.g. 1, 1.2, 1.5)
  sellingPrice: number; // Rp
  costPrice: number; // Rp
  margin: number; // Rp
}

export const PRODUCTS: ProductDefinition[] = [
  { id: 'p1', name: 'Premium 1L', volume: 1.0, sellingPrice: 12000, costPrice: 10000, margin: 2000 },
  { id: 'p2', name: 'Premium 1.2L', volume: 1.2, sellingPrice: 15000, costPrice: 12000, margin: 3000 },
  { id: 'p3', name: 'Premium 1.5L', volume: 1.5, sellingPrice: 20000, costPrice: 15000, margin: 5000 },
];

export interface DailyRecapInput {
  productId: string;
  openingStock: number; // in units (bottles/counts)
  closingStock: number; // in units (bottles/counts)
}

export interface ProductRecapResult extends DailyRecapInput {
  soldQty: number;
  revenue: number;
  capital: number;
  profit: number;
}

export interface FinanceSummary {
  cashIn: number;
  cashOut: number;
  netFinanceFlow: number;
}

export interface DailyRecapResult {
  id: string;
  date: string; // YYYY-MM-DD
  items: ProductRecapResult[];
  totalSoldLiters: number;
  totalRevenue: number;
  totalCapital: number;
  totalNetProfit: number;
  cashSummary: FinanceSummary;
}

export function calculateProductRecap(input: DailyRecapInput, productsList: ProductDefinition[]): ProductRecapResult {
  const product = productsList.find((p) => p.id === input.productId);
  if (!product) {
    throw new Error(`Product not found: ${input.productId}`);
  }

  const soldQty = Math.max(0, input.openingStock - input.closingStock);
  const revenue = soldQty * product.sellingPrice;
  const capital = soldQty * product.costPrice;
  const profit = soldQty * product.margin;

  return {
    ...input,
    soldQty,
    revenue,
    capital,
    profit,
  };
}

export function calculateDailyRecap(
  id: string,
  date: string,
  itemsInput: DailyRecapInput[],
  cashIn: number,
  cashOut: number,
  productsList: ProductDefinition[]
): DailyRecapResult {
  let totalSoldLiters = 0;
  let totalRevenue = 0;
  let totalCapital = 0;
  let totalNetProfit = 0;

  const items = itemsInput.map((item) => {
    const recap = calculateProductRecap(item, productsList);
    const product = productsList.find((p) => p.id === item.productId)!;
    
    totalSoldLiters += recap.soldQty * product.volume;
    totalRevenue += recap.revenue;
    totalCapital += recap.capital;
    totalNetProfit += recap.profit;

    return recap;
  });

  return {
    id,
    date,
    items,
    totalSoldLiters,
    totalRevenue,
    totalCapital,
    totalNetProfit,
    cashSummary: {
      cashIn,
      cashOut,
      netFinanceFlow: cashIn - cashOut,
    },
  };
}
