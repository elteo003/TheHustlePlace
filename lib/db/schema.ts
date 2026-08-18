import { bigint, index, integer, pgTable, smallint, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const watchHistory = pgTable(
    'watch_history',
    {
        id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
        deviceId: uuid('device_id').notNull(),
        tmdbId: integer('tmdb_id').notNull(),
        contentType: text('content_type').$type<'movie' | 'tv'>().notNull(),
        title: text().notNull(),
        posterPath: text('poster_path'),
        backdropPath: text('backdrop_path'),
        season: integer(),
        episode: integer(),
        progress: smallint().notNull().default(0),
        positionSeconds: integer('position_seconds').notNull().default(0),
        watchedAt: timestamp('watched_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    },
    (table) => [
        unique('watch_history_device_title_uid').on(table.deviceId, table.contentType, table.tmdbId),
        index('watch_history_device_watched_at_idx').on(table.deviceId, table.watchedAt),
    ]
)
