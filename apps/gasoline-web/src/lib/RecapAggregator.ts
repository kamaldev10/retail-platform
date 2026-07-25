import { DailyRecapResult } from './calculations'

export interface PeriodRecap {
	period: string
	dateRange: string
	totalDays: number
	totalSoldLiters: number
	totalRevenue: number
	totalCapital: number
	totalNetProfit: number
	totalCashIn: number
	totalCashOut: number
	netCashFlow: number
	avgDailyRevenue: number
	avgDailyProfit: number
	items: DailyRecapResult[]
}

/**
 * Returns ISO week number (Senin–Minggu) for a given date string (YYYY-MM-DD).
 */
function getISOWeekNumber(dateStr: string): { year: number; week: number } {
	const date = new Date(dateStr + 'T00:00:00')
	const dayOfWeek = date.getDay() || 7 // Convert Sunday=0 to 7
	date.setDate(date.getDate() + 4 - dayOfWeek) // Set to nearest Thursday
	const yearStart = new Date(date.getFullYear(), 0, 1)
	const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
	return { year: date.getFullYear(), week: weekNo }
}

/**
 * Returns the Monday and Sunday for a given ISO week.
 */
function getWeekDateRange(year: number, week: number): { start: Date; end: Date } {
	const jan4 = new Date(year, 0, 4)
	const dayOfWeek = jan4.getDay() || 7
	const monday = new Date(jan4)
	monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7)
	const sunday = new Date(monday)
	sunday.setDate(monday.getDate() + 6)
	return { start: monday, end: sunday }
}

function formatDateShort(date: Date): string {
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'Mei',
		'Jun',
		'Jul',
		'Agu',
		'Sep',
		'Okt',
		'Nov',
		'Des',
	]
	return `${date.getDate()} ${months[date.getMonth()]}`
}

function aggregateGroup(
	recaps: DailyRecapResult[],
): Omit<PeriodRecap, 'period' | 'dateRange' | 'items'> {
	const totalDays = recaps.length
	const totalSoldLiters = recaps.reduce((sum, r) => sum + r.totalSoldLiters, 0)
	const totalRevenue = recaps.reduce((sum, r) => sum + r.totalRevenue, 0)
	const totalCapital = recaps.reduce((sum, r) => sum + r.totalCapital, 0)
	const totalNetProfit = recaps.reduce((sum, r) => sum + r.totalNetProfit, 0)
	const totalCashIn = recaps.reduce((sum, r) => sum + r.cashSummary.cashIn, 0)
	const totalCashOut = recaps.reduce((sum, r) => sum + r.cashSummary.cashOut, 0)

	return {
		totalDays,
		totalSoldLiters,
		totalRevenue,
		totalCapital,
		totalNetProfit,
		totalCashIn,
		totalCashOut,
		netCashFlow: totalCashIn - totalCashOut,
		avgDailyRevenue: totalDays > 0 ? totalRevenue / totalDays : 0,
		avgDailyProfit: totalDays > 0 ? totalNetProfit / totalDays : 0,
	}
}

/**
 * Groups daily recaps by ISO week (Senin–Minggu).
 * Returns sorted by most recent week first.
 */
export function groupByWeek(recaps: DailyRecapResult[]): PeriodRecap[] {
	const groups = new Map<string, DailyRecapResult[]>()

	for (const recap of recaps) {
		const { year, week } = getISOWeekNumber(recap.date)
		const key = `${year}-W${String(week).padStart(2, '0')}`
		const existing = groups.get(key) ?? []
		existing.push(recap)
		groups.set(key, existing)
	}

	const result: PeriodRecap[] = []

	for (const [period, items] of groups.entries()) {
		const [yearStr, weekStr] = period.split('-W')
		const year = parseInt(yearStr, 10)
		const week = parseInt(weekStr, 10)
		const { start, end } = getWeekDateRange(year, week)
		const dateRange = `${formatDateShort(start)} – ${formatDateShort(end)} ${year}`
		const agg = aggregateGroup(items)

		result.push({ period, dateRange, ...agg, items })
	}

	return result.sort((a, b) => b.period.localeCompare(a.period))
}

/**
 * Groups daily recaps by month (YYYY-MM).
 * Returns sorted by most recent month first.
 */
export function groupByMonth(recaps: DailyRecapResult[]): PeriodRecap[] {
	const groups = new Map<string, DailyRecapResult[]>()
	const monthNames = [
		'Januari',
		'Februari',
		'Maret',
		'April',
		'Mei',
		'Juni',
		'Juli',
		'Agustus',
		'September',
		'Oktober',
		'November',
		'Desember',
	]

	for (const recap of recaps) {
		const key = recap.date.substring(0, 7) // YYYY-MM
		const existing = groups.get(key) ?? []
		existing.push(recap)
		groups.set(key, existing)
	}

	const result: PeriodRecap[] = []

	for (const [period, items] of groups.entries()) {
		const [yearStr, monthStr] = period.split('-')
		const monthIndex = parseInt(monthStr, 10) - 1
		const dateRange = `${monthNames[monthIndex]} ${yearStr}`
		const agg = aggregateGroup(items)

		result.push({ period, dateRange, ...agg, items })
	}

	return result.sort((a, b) => b.period.localeCompare(a.period))
}
