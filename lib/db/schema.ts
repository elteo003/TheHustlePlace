import { bigint, boolean, index, integer, jsonb, pgTable, smallint, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const households = pgTable('households', {
    id: uuid().defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
})

export const watchProfiles = pgTable('watch_profiles', {
    id: uuid().defaultRandom().primaryKey(),
    pairCode: text('pair_code').notNull().unique(),
    householdId: uuid('household_id').references(() => households.id),
    name: text(),
    avatar: smallint(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
})

export const watchDevices = pgTable(
    'watch_devices',
    {
        deviceId: uuid('device_id').primaryKey(),
        profileId: uuid('profile_id')
            .notNull()
            .references(() => watchProfiles.id, { onDelete: 'cascade' }),
        householdId: uuid('household_id').references(() => households.id),
        activeProfileId: uuid('active_profile_id').references(() => watchProfiles.id),
        kind: text().$type<'tv' | 'web'>(),
        pairedAt: timestamp('paired_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    },
    (table) => [index('watch_devices_profile_id_idx').on(table.profileId)]
)

export const watchHistory = pgTable(
    'watch_history',
    {
        id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
        deviceId: uuid('device_id').notNull(),
        profileId: uuid('profile_id')
            .notNull()
            .references(() => watchProfiles.id),
        tmdbId: integer('tmdb_id').notNull(),
        contentType: text('content_type').$type<'movie' | 'tv'>().notNull(),
        title: text().notNull(),
        posterPath: text('poster_path'),
        backdropPath: text('backdrop_path'),
        season: integer(),
        episode: integer(),
        progress: smallint().notNull().default(0),
        positionSeconds: integer('position_seconds').notNull().default(0),
        continueHidden: boolean('continue_hidden').notNull().default(false),
        watchedAt: timestamp('watched_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    },
    (table) => [
        unique('watch_history_profile_title_uid').on(table.profileId, table.contentType, table.tmdbId),
        index('watch_history_profile_watched_at_idx').on(table.profileId, table.watchedAt),
    ]
)

export const titleFeedback = pgTable(
    'title_feedback',
    {
        id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
        profileId: uuid('profile_id')
            .notNull()
            .references(() => watchProfiles.id, { onDelete: 'cascade' }),
        tmdbId: integer('tmdb_id').notNull(),
        contentType: text('content_type').$type<'movie' | 'tv'>().notNull(),
        season: integer().notNull().default(0),
        moment: text().$type<'mid_season' | 'end_season' | 'end_movie' | 'dismiss'>().notNull(),
        liking: text().$type<'yes' | 'a_lot' | 'thrilled' | 'skipped' | 'disliked' | 'not_interested'>().notNull(),
        wouldContinue: text('would_continue').$type<'yes' | 'no'>(),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    },
    (table) => [
        unique('title_feedback_profile_title_moment_uid').on(
            table.profileId,
            table.contentType,
            table.tmdbId,
            table.season,
            table.moment
        ),
        index('title_feedback_profile_idx').on(table.profileId),
    ]
)

export const tasteSnapshot = pgTable('taste_snapshot', {
    profileId: uuid('profile_id')
        .primaryKey()
        .references(() => watchProfiles.id, { onDelete: 'cascade' }),
    payload: jsonb().$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
})

export const rankerWeights = pgTable('ranker_weights', {
    version: text().primaryKey(),
    weights: jsonb().$type<Record<string, number | string>>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
})

