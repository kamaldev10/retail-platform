import { NextRequest, NextResponse } from 'next/server'
import { gasolineLiveStockRepository } from '@retail/database'
import { checkAdminAccess } from '@/lib/supabaseServer'

// GET /api/stock — fetch current live stock from DB
export async function GET() {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json(
				{ error: 'Unauthorized', details: auth.error },
				{ status: auth.error?.includes('Forbidden') ? 403 : 401 },
			)
		}

		const rows = await gasolineLiveStockRepository.getAll()

		// Convert flat rows to { jerigen, bottles } shape
		const jerigen = rows.find(r => r.product_id === '__jerigen__')?.quantity ?? 0
		const bottles: Record<string, number> = {}
		rows
			.filter(r => r.product_id !== '__jerigen__')
			.forEach(r => {
				bottles[r.product_id] = r.quantity
			})

		return NextResponse.json({ jerigen, bottles })
	} catch (error) {
		console.error('Failed to fetch live stock:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}

// POST /api/stock — persist live stock (jerigen qty edits from home + bottle rows)
export async function POST(request: NextRequest) {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json(
				{ error: 'Unauthorized', details: auth.error },
				{ status: auth.error?.includes('Forbidden') ? 403 : 401 },
			)
		}

		const body = await request.json()
		const { jerigen, bottles } = body as { jerigen: number; bottles: Record<string, number> }

		if (typeof jerigen !== 'number' || typeof bottles !== 'object') {
			return NextResponse.json(
				{ error: 'Payload harus mengandung `jerigen` (number) dan `bottles` (object)' },
				{ status: 400 },
			)
		}

		const rows = [
			{ product_id: '__jerigen__', quantity: jerigen },
			...Object.entries(bottles).map(([product_id, quantity]) => ({ product_id, quantity })),
		]

		await gasolineLiveStockRepository.upsertMany(rows)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Failed to persist live stock:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}
