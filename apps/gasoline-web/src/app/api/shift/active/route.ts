import { NextRequest, NextResponse } from 'next/server'
import { gasolineActiveShiftRepository } from '@retail/database'
import { checkAdminAccess } from '@/lib/supabaseServer'

export async function GET() {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const shift = await gasolineActiveShiftRepository.get()
		return NextResponse.json(shift)
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
		await gasolineActiveShiftRepository.upsert(body)
		return NextResponse.json({ success: true })
	} catch (error) {
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}

export async function DELETE() {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		await gasolineActiveShiftRepository.clear()
		return NextResponse.json({ success: true })
	} catch (error) {
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}
