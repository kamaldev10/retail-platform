import { NextResponse } from 'next/server';
import { prisma, GasolineRecap, GasolineProductRecap } from '@retail/database';
import { checkAdminAccess } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const auth = await checkAdminAccess();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized', details: auth.error },
        { status: auth.error?.includes('Forbidden') ? 403 : 401 }
      );
    }

    const dbRecaps = await prisma.gasolineRecap.findMany({
      include: {
        items: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Map database structures back to match client calculations interface
    const recaps = dbRecaps.map((recap: GasolineRecap & { items: GasolineProductRecap[] }) => ({
      id: recap.id,
      date: recap.date,
      totalSoldLiters: recap.totalSoldLiters,
      totalRevenue: recap.totalRevenue,
      totalCapital: recap.totalCapital,
      totalNetProfit: recap.totalNetProfit,
      cashSummary: {
        cashIn: recap.cashIn,
        cashOut: recap.cashOut,
        netFinanceFlow: recap.netFinanceFlow,
      },
      items: recap.items.map((item: GasolineProductRecap) => ({
        productId: item.productId,
        openingStock: item.openingStock,
        closingStock: item.closingStock,
        soldQty: item.soldQty,
        revenue: item.revenue,
        capital: item.capital,
        profit: item.profit,
      })),
    }));

    return NextResponse.json(recaps);
  } catch (error) {
    console.error('Failed to fetch gasoline recaps:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', details },
      { status: 500 }
    );
  }
}
