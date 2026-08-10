export function formatDateID(dateString: string | Date, includeDay = true): string {
	if (!dateString) return ''
	const date = typeof dateString === 'string' ? new Date(dateString) : dateString

	if (isNaN(date.getTime())) return String(dateString)

	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}

	if (includeDay) {
		options.weekday = 'long'
	}

	return new Intl.DateTimeFormat('id-ID', options).format(date)
}

export function formatShortDateID(dateString: string | Date): string {
	if (!dateString) return ''
	const date = typeof dateString === 'string' ? new Date(dateString) : dateString

	if (isNaN(date.getTime())) return String(dateString)

	return new Intl.DateTimeFormat('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(date)
}
