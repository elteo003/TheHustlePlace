import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Database = PostgresJsDatabase<typeof schema>

const globalForDb = globalThis as unknown as {
    drizzleDb: Database | undefined
}

export function isDatabaseConfigured(): boolean {
    return Boolean(process.env.DATABASE_URL)
}

export function getDb(): Database | null {
    const url = process.env.DATABASE_URL
    if (!url) {
        return null
    }

    if (globalForDb.drizzleDb) {
        return globalForDb.drizzleDb
    }

    const client = postgres(url, {
        prepare: false,
        max: 1,
        ssl: 'require',
    })

    const db = drizzle(client, { schema })
    globalForDb.drizzleDb = db
    return db
}
