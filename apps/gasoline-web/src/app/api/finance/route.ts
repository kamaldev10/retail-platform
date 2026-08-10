import { NextRequest, NextResponse } from 'next/server'
import { gasolineFinanceRepository } from '@retail/database'
import { checkAdminAccess } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json(
				{ error: 'Unauthorized', details: auth.error },
				{ status: auth.error?.includes('Forbidden') ? 403 : 401 },
			)
		}

		const { searchParams } = new URL(request.url)
		const startDate = searchParams.get('startDate') || undefined
		const endDate = searchParams.get('endDate') || undefined
		const category = searchParams.get('category') || undefined
		const flowType = (searchParams.get('flowType') as 'IN' | 'OUT') || undefined

		const entries = await gasolineFinanceRepository.findAllFinances({
			startDate,
			endDate,
			category,
			flowType,
		})

		const summary = await gasolineFinanceRepository.getSummary(startDate, endDate)

		return NextResponse.json({ entries, summary })
	} catch (error) {
		console.error('Failed to fetch finance records:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}

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
		const { transactionDate, flowType, category, amount, paymentMethod, description } = body

		if (!flowType || !category || typeof amount !== 'number' || amount <= 0) {
			return NextResponse.json(
				{ error: 'Payload harus mengandung `flowType`, `category`, dan `amount` > 0' },
				{ status: 400 },
			)
		}

		const entry = await gasolineFinanceRepository.createEntry({
			transactionDate,
			flowType,
			category,
			amount,
			paymentMethod: paymentMethod || 'CASH',
			referenceType: 'MANUAL',
			createdBy: auth.user?.email,
			description,
		})

		return NextResponse.json(entry, { status: 201 })
	} catch (error) {
		console.error('Failed to create finance entry:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}
