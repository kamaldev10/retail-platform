import { NextRequest, NextResponse } from 'next/server'
import { gasolineProductRepository } from '@retail/database'
import { checkAdminAccess } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// GET /api/products — fetch product catalog from database
export async function GET() {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json(
				{ error: 'Unauthorized', details: auth.error },
				{ status: auth.error?.includes('Forbidden') ? 403 : 401 },
			)
		}

		const dbProducts = await gasolineProductRepository.getAll()
		const products = dbProducts.map(p => ({
			id: p.id,
			name: p.name,
			volume: p.volume,
			sellingPrice: p.selling_price,
			costPrice: p.cost_price,
			margin: p.margin,
		}))

		return NextResponse.json(products)
	} catch (error) {
		console.error('Failed to fetch product catalog:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}

// POST /api/products — add or update product in catalog
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
		const { id, name, volume, sellingPrice, costPrice, margin } = body as {
			id: string
			name: string
			volume: number
			sellingPrice: number
			costPrice: number
			margin: number
		}

		if (!id || !name || typeof volume !== 'number') {
			return NextResponse.json(
				{ error: 'Payload tidak valid. Membutuhkan id, name, volume, sellingPrice, costPrice' },
				{ status: 400 },
			)
		}

		const saved = await gasolineProductRepository.upsert({
			id,
			name,
			volume,
			selling_price: sellingPrice,
			cost_price: costPrice,
			margin: margin ?? sellingPrice - costPrice,
		})

		return NextResponse.json({
			success: true,
			product: {
				id: saved.id,
				name: saved.name,
				volume: saved.volume,
				sellingPrice: saved.selling_price,
				costPrice: saved.cost_price,
				margin: saved.margin,
			},
		})
	} catch (error) {
		console.error('Failed to save product:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}

// DELETE /api/products?id=p1 — delete product from catalog
export async function DELETE(request: NextRequest) {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json(
				{ error: 'Unauthorized', details: auth.error },
				{ status: auth.error?.includes('Forbidden') ? 403 : 401 },
			)
		}

		const { searchParams } = new URL(request.url)
		const id = searchParams.get('id')

		if (!id) {
			return NextResponse.json({ error: 'Parameter id wajib diisi' }, { status: 400 })
		}

		await gasolineProductRepository.delete(id)
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Failed to delete product:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}
