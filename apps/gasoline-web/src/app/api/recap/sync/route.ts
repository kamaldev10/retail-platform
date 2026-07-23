import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@retail/database';
import { checkAdminAccess } from '@/lib/supabaseServer';

interface SyncItemInput {
  productId: string;
  openingStock: number;
  closingStock: number;
  soldQty?: number;
  revenue?: number;
  capital?: number;
  profit?: number;
}

interface SyncRecapInput {
  id: string;
  date: string;
  totalSoldLiters: number;
  totalRevenue: number;
  totalCapital: number;
  totalNetProfit: number;
  cashSummary: {
    cashIn: number;
    cashOut: number;
    netFinanceFlow: number;
  };
  items: SyncItemInput[];
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized', details: auth.error },
        { status: auth.error?.includes('Forbidden') ? 403 : 401 }
      );
    }

    const body = await request.json();
    const recaps = body.recaps as SyncRecapInput[];

    if (!Array.isArray(recaps)) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'recaps field must be an array.' },
        { status: 400 }
      );
    }

    // Execute upsert transactions
    await prisma.$transaction(
      recaps.map((recap) =>
        prisma.gasolineRecap.upsert({
          where: { date: recap.date },
          update: {
            totalSoldLiters: recap.totalSoldLiters,
            totalRevenue: recap.totalRevenue,
            totalCapital: recap.totalCapital,
            totalNetProfit: recap.totalNetProfit,
            cashIn: recap.cashSummary.cashIn,
            cashOut: recap.cashSummary.cashOut,
            netFinanceFlow: recap.cashSummary.netFinanceFlow,
            items: {
              deleteMany: {},
              create: recap.items.map((item: SyncItemInput) => ({
                productId: item.productId,
                openingStock: item.openingStock,
                closingStock: item.closingStock,
                soldQty: item.soldQty || 0,
                revenue: item.revenue || 0,
                capital: item.capital || 0,
                profit: item.profit || 0,
              })),
            },
          },
          create: {
            date: recap.date,
            totalSoldLiters: recap.totalSoldLiters,
            totalRevenue: recap.totalRevenue,
            totalCapital: recap.totalCapital,
            totalNetProfit: recap.totalNetProfit,
            cashIn: recap.cashSummary.cashIn,
            cashOut: recap.cashSummary.cashOut,
            netFinanceFlow: recap.cashSummary.netFinanceFlow,
            items: {
              create: recap.items.map((item: SyncItemInput) => ({
                productId: item.productId,
                openingStock: item.openingStock,
                closingStock: item.closingStock,
                soldQty: item.soldQty || 0,
                revenue: item.revenue || 0,
                capital: item.capital || 0,
                profit: item.profit || 0,
              })),
            },
          },
        })
      )
    );

    return NextResponse.json({ success: true, syncedCount: recaps.length });
  } catch (error) {
    console.error('Failed to sync gasoline recaps:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', details },
      { status: 500 }
    );
  }
}
