import { NextRequest, NextResponse } from 'next/server'
import { gasolineShiftTransactionRepository } from '@retail/database'
import { checkAdminAccess } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const { searchParams } = new URL(request.url)
		const shiftDate = searchParams.get('shiftDate')
		if (!shiftDate) return NextResponse.json({ error: 'shiftDate is required' }, { status: 400 })
		const txs = await gasolineShiftTransactionRepository.findByShiftDate(shiftDate)
		return NextResponse.json(txs)
	} catch (error) {
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const body = await request.json()
		const tx = await gasolineShiftTransactionRepository.insert(body)
		return NextResponse.json(tx, { status: 201 })
	} catch (error) {
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}
