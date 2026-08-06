import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

declare global {
	// eslint-disable-next-line no-var
	var pgPool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	console.warn('⚠️ Warning: DATABASE_URL environment variable is not defined.')
}

export const pool =
	global.pgPool ||
	new Pool({
		connectionString,
		max: 10,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 5000,
	})

if (process.env.NODE_ENV !== 'production') {
	global.pgPool = pool
}

/**
 * Execute a parameterized Raw SQL query against the connection pool.
 */
export async function query<T extends QueryResultRow = any>(
	text: string,
	params?: any[],
): Promise<QueryResult<T>> {
	const start = Date.now()
	try {
		const res = await pool.query<T>(text, params)
		const duration = Date.now() - start
		if (process.env.NODE_ENV === 'development') {
			console.log('⚡ Executed query', {
				text: text.trim().replace(/\s+/g, ' '),
				duration,
				rows: res.rowCount,
			})
		}
		return res
	} catch (error) {
		console.error('❌ Database query error:', { text, params, error })
		throw error
	}
}

/**
 * Execute a batch of SQL statements within a single atomic database transaction.
 */
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
	const client = await pool.connect()
	try {
		await client.query('BEGIN')
		const result = await callback(client)
		await client.query('COMMIT')
		return result
	} catch (error) {
		await client.query('ROLLBACK')
		console.error('❌ Database transaction rolled back due to error:', error)
		throw error
	} finally {
		client.release()
	}
}
