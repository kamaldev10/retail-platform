import { NextResponse } from 'next/server'
import { salaryPaymentRepository } from '@retail/database'
import { checkAdminAccess } from '@/lib/supabaseServer'

export async function GET() {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json(
				{ error: 'Unauthorized', details: auth.error },
				{ status: auth.error?.includes('Forbidden') ? 403 : 401 },
			)
		}

		const salaries = await salaryPaymentRepository.findAllSalaries()
		return NextResponse.json(salaries)
	} catch (error) {
		console.error('Failed to fetch salary payments:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json(
				{ error: 'Unauthorized', details: auth.error },
				{ status: auth.error?.includes('Forbidden') ? 403 : 401 },
			)
		}

		const body = await request.json()
		const { date, weekLabel, amount, recipient, note } = body

		if (!date || !amount || amount <= 0) {
			return NextResponse.json(
				{ error: 'Bad Request', details: 'Date and valid amount are required' },
				{ status: 400 },
			)
		}

		const salary = await salaryPaymentRepository.createSalary({
			date,
			weekLabel: weekLabel || undefined,
			amount: Number(amount),
			recipient: recipient || undefined,
			note: note || undefined,
		})

		return NextResponse.json(salary, { status: 201 })
	} catch (error) {
		console.error('Failed to create salary payment:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}
