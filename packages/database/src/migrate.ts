import fs from 'fs'
import path from 'path'
import { pool } from './connection'

async function runMigrations() {
	console.log('🔄 Running database SQL migrations per schema namespace...')
	const migrationsDir = path.join(__dirname, '../migrations')

	if (!fs.existsSync(migrationsDir)) {
		console.error('❌ Migrations directory not found:', migrationsDir)
		process.exit(1)
	}

	const files = fs
		.readdirSync(migrationsDir)
		.filter(file => file.endsWith('.sql'))
		.sort()

	if (files.length === 0) {
		console.log('⚠️ No SQL migration files found.')
		return
	}

	for (const file of files) {
		const filePath = path.join(migrationsDir, file)
		const sql = fs.readFileSync(filePath, 'utf8')
		console.log(`📄 Executing migration: ${file}...`)

		const client = await pool.connect()
		try {
			await client.query('BEGIN')
			await client.query(sql)
			await client.query('COMMIT')
			console.log(`✅ Migration ${file} executed successfully!`)
		} catch (err) {
			await client.query('ROLLBACK')
			console.error(`❌ Migration ${file} failed:`, err)
			throw err
		} finally {
			client.release()
		}
	}
}

runMigrations()
	.then(() => {
		console.log('🎉 All schema migrations completed successfully!\n')
	})
	.catch(err => {
		console.error('❌ Fatal migration error:', err)
		process.exit(1)
	})
	.finally(async () => {
		await pool.end()
	})
