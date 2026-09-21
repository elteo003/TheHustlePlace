import axios from 'axios'
import { cache } from '@/utils/cache'
import { logger } from '@/utils/logger'
import { Movie, TVShow, Genre, CatalogFilters, PaginatedResponse, Top10Content } from '@/types'
import { VixsrcScraperService } from './vixsrc-scraper.service'
import { tmdbWrapperService } from './tmdb-wrapper.service'
import { TMDBMovie } from './tmdb-movies.service'
import { getVixsrcIdSet } from './vixsrc-ids.service'
import { filterByVixsrcIds, collectVixsrcTmdbIds, contentTmdbId } from '@/lib/vixsrc-ids'
import {
    comingSoonWindow,
    excludeAvailableOnVixsrc,
    keepFutureReleases,
    keepNotableComingSoon,
    mapTmdbItemToTop10,
    mergeComingSoon,
    sortComingSoonByDate,
    takeGlobalTrending,
    type TmdbRailItem,
} from '@/lib/catalog-rails'
import {
    PERSONAL_OVERFETCH,
    PERSONAL_RAIL_SIZE,
    TASTE_WINDOW,
    type AffinityFlags,
    type HistorySeed,
    type PersonalRails,
    type TitleFeatures,
    buildTasteProfile,
    composePersonalRails,
    genrePipe,
    occupiedKeys,
    railItemKey,
    toDiscoverGenres,
    yearsAgoIso,
} from '@/lib/personal-rails'
import {
    composeMomentTop10,
    mapTrendingList,
    streamingProviderPipe,
    yearsAgoFrom,
} from '@/lib/top10-moment'
import {
    EDITORIAL_RAIL_SIZE,
    PERIOD_KEYWORDS,
    POLITICS_KEYWORDS,
    TMDB_GENRE,
    WAR_KEYWORDS,
    composeEditorialRails,
    keywordPipe,
    type EditorialRails,
} from '@/lib/editorial-rails'

export class CatalogService {
    private readonly VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'
    private readonly CACHE_TTL = 3600 // 1 hour
    private readonly vixsrcScraper: VixsrcScraperService

    constructor() {
        this.vixsrcScraper = new VixsrcScraperService()
    }

    private convertTMDBMovieToMovie(tmdbMovie: TMDBMovie): Movie {
        return {
            id: tmdbMovie.id,
            title: tmdbMovie.title,
            overview: tmdbMovie.overview,
            poster_path: tmdbMovie.poster_path || undefined,
            backdrop_path: tmdbMovie.backdrop_path || undefined,
            release_date: tmdbMovie.release_date,
            vote_average: tmdbMovie.vote_average,
            vote_count: tmdbMovie.vote_count,
            genre_ids: tmdbMovie.genre_ids,
            adult: tmdbMovie.adult,
            original_language: tmdbMovie.original_language,
            original_title: tmdbMovie.original_title,
            popularity: tmdbMovie.popularity,
            video: tmdbMovie.video,
            tmdb_id: tmdbMovie.id
        }
    }

    private convertTMDBTVShowToTVShow(tmdbTVShow: any): TVShow {
        return {
            id: tmdbTVShow.id,
            name: tmdbTVShow.name,
            overview: tmdbTVShow.overview,
            poster_path: tmdbTVShow.poster_path || undefined,
            backdrop_path: tmdbTVShow.backdrop_path || undefined,
            first_air_date: tmdbTVShow.first_air_date,
            vote_average: tmdbTVShow.vote_average,
            vote_count: tmdbTVShow.vote_count,
            genre_ids: tmdbTVShow.genre_ids || [],
            adult: tmdbTVShow.adult || false,
            original_language: tmdbTVShow.original_language,
            original_name: tmdbTVShow.original_name,
            popularity: tmdbTVShow.popularity || 0,
            origin_country: tmdbTVShow.origin_country || [],
            tmdb_id: tmdbTVShow.id
        }
    }

    // Nuovo metodo per film "now playing" (appena usciti al cinema)
    async getNowPlayingMovies(): Promise<Movie[]> {
        try {
            const cacheKey = 'now-playing-movies'
            const cached = await cache.get<Movie[]>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa direttamente TMDB API per i film "now playing"
            const response = await tmdbWrapperService.getNowPlayingMovies()

            if (response && response.results) {
                const movies = response.results.map(tmdbMovie => this.convertTMDBMovieToMovie(tmdbMovie))
                const available = await this.filterAvailableMovies(movies)
                await cache.set(cacheKey, available, { ttl: this.CACHE_TTL })
                logger.info('Film now playing recuperati con successo', { count: available.length })
                return available
            }

            return []
        } catch (error) {
            logger.error('Errore nel recupero film now playing', { error })
            return []
        }
    }

    // Nuovo metodo per i top 10 film - usa TMDB
    async getTop10Movies(): Promise<Movie[]> {
        try {
            const cacheKey = 'top-10-movies-v2'
            const cached = await cache.get<Movie[]>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa TMDB per i top 10 film
            const response = await tmdbWrapperService.getPopularMovies(1)

            if (response && response.results) {
                const movies = response.results.map(tmdbMovie => this.convertTMDBMovieToMovie(tmdbMovie))
                const available = await this.filterAvailableMovies(movies)
                await cache.set(cacheKey, available, { ttl: this.CACHE_TTL })
                logger.info('Top 10 film recuperati da TMDB', { count: available.length })
                return available
            }

            return []
        } catch (error) {
            logger.error('Errore nel recupero top 10 film', { error })
            return []
        }
    }

    // Metodi di conversione per Top10Content
    private convertMovieToTop10Content(movie: Movie): Top10Content {
        return {
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            vote_count: movie.vote_count,
            genre_ids: movie.genre_ids,
            adult: movie.adult,
            original_language: movie.original_language,
            original_title: movie.original_title,
            popularity: movie.popularity,
            video: movie.video,
            tmdb_id: movie.tmdb_id,
            type: 'movie'
        }
    }

    private convertTVShowToTop10Content(tvShow: TVShow): Top10Content {
        return {
            id: tvShow.id,
            title: tvShow.name,
            name: tvShow.name,
            overview: tvShow.overview,
            poster_path: tvShow.poster_path,
            backdrop_path: tvShow.backdrop_path,
            release_date: tvShow.first_air_date,
            first_air_date: tvShow.first_air_date,
            vote_average: tvShow.vote_average,
            vote_count: tvShow.vote_count,
            genre_ids: tvShow.genre_ids,
            adult: tvShow.adult,
            original_language: tvShow.original_language,
            original_name: tvShow.original_name,
            popularity: tvShow.popularity,
            origin_country: tvShow.origin_country,
            tmdb_id: tvShow.tmdb_id,
            type: 'tv'
        }
    }

    async getGlobalTrending(limit = 20): Promise<Top10Content[]> {
        try {
            const cacheKey = 'global-trending-week-v2'
            const cached = await cache.get<Top10Content[]>(cacheKey)
            if (cached) {
                return cached.slice(0, limit)
            }

            const [page1, page2] = await Promise.all([
                tmdbWrapperService.getTrendingAllWeek(1),
                tmdbWrapperService.getTrendingAllWeek(2),
            ])
            const trending = takeGlobalTrending(
                [...(page1?.results || []), ...(page2?.results || [])] as TmdbRailItem[],
                40
            )

            await cache.set(cacheKey, trending, { ttl: this.CACHE_TTL })
            logger.info('Trending globale recuperato', {
                count: trending.length,
                movies: trending.filter((item) => item.type === 'movie').length,
                tvShows: trending.filter((item) => item.type === 'tv').length,
            })

            return trending.slice(0, limit)
        } catch (error) {
            logger.error('Errore nel recupero trending globale', { error })
            return []
        }
    }

    async getTop10Mixed(): Promise<Top10Content[]> {
        const bucket = Math.floor(Date.now() / (20 * 60 * 1000))
        const cacheKey = `top10-moment-v1:${bucket}`
        const cached = await cache.get<Top10Content[]>(cacheKey)
        if (cached?.length) {
            return cached
        }

        try {
            const now = new Date()
            const providers = streamingProviderPipe()
            const movieFrom = yearsAgoFrom(now, 3)
            const tvFrom = yearsAgoFrom(now, 10)

            const [day, week, streamingMovies, streamingShows, cinemaPage1, cinemaPage2] = await Promise.all([
                tmdbWrapperService.getTrendingAllDay(1),
                tmdbWrapperService.getTrendingAllWeek(1),
                this.discoverPages('movie', {
                    sort_by: 'popularity.desc',
                    watch_region: 'IT',
                    with_watch_providers: providers,
                    with_watch_monetization_types: 'flatrate',
                    'primary_release_date.gte': movieFrom,
                    include_adult: false,
                    'vote_count.gte': 40,
                }),
                this.discoverPages('tv', {
                    sort_by: 'popularity.desc',
                    watch_region: 'IT',
                    with_watch_providers: providers,
                    with_watch_monetization_types: 'flatrate',
                    'first_air_date.gte': tvFrom,
                    'vote_count.gte': 40,
                }),
                tmdbWrapperService.getNowPlayingMovies(1),
                tmdbWrapperService.getNowPlayingMovies(2),
            ])

            const cinema = this.mapRailItems(
                [...(cinemaPage1?.results || []), ...(cinemaPage2?.results || [])] as TmdbRailItem[],
                'movie'
            )

            const [trendingDay, trendingWeek, streaming, cinemaAvailable] = await Promise.all([
                this.filterAvailableMixed(mapTrendingList((day?.results || []) as TmdbRailItem[])),
                this.filterAvailableMixed(mapTrendingList((week?.results || []) as TmdbRailItem[])),
                this.filterAvailableMixed([...streamingMovies, ...streamingShows]),
                this.filterAvailableMixed(cinema),
            ])

            const top10 = this.decorateRailItems(
                composeMomentTop10(
                    {
                        trendingDay,
                        trendingWeek,
                        streaming,
                        cinema: cinemaAvailable,
                    },
                    now,
                    10
                )
            )

            await cache.set(cacheKey, top10, { ttl: 25 * 60 })
            logger.info('Top 10 del momento costruita', {
                count: top10.length,
                movies: top10.filter((item) => item.type === 'movie').length,
                tvShows: top10.filter((item) => item.type === 'tv').length,
                titles: top10.map((item) => item.title),
            })
            return top10
        } catch (error) {
            logger.error('Errore nella costruzione top 10 del momento', { error })
            return this.getGlobalTrending(10)
        }
    }

    async getComingSoon(limit = 20): Promise<Top10Content[]> {
        try {
            const cacheKey = 'coming-soon-notable-v2'
            const cached = await cache.get<Top10Content[]>(cacheKey)
            if (cached) {
                return cached.slice(0, limit)
            }

            const { from, to } = comingSoonWindow()
            const [upcomingMovies, discoverMovies, newShows, movieIds, tvIds] = await Promise.all([
                tmdbWrapperService.getUpcomingMovies(1),
                tmdbWrapperService.discoverMovies({
                    'primary_release_date.gte': from,
                    'primary_release_date.lte': to,
                    sort_by: 'popularity.desc',
                    'vote_count.gte': 20,
                }),
                tmdbWrapperService.discoverTVShows({
                    'first_air_date.gte': from,
                    'first_air_date.lte': to,
                    sort_by: 'popularity.desc',
                }),
                getVixsrcIdSet('movie'),
                getVixsrcIdSet('tv'),
            ])

            const merged = mergeComingSoon([
                { type: 'movie', items: (upcomingMovies?.results || []) as TmdbRailItem[] },
                { type: 'movie', items: (discoverMovies?.results || []) as TmdbRailItem[] },
                { type: 'tv', items: (newShows?.results || []) as TmdbRailItem[] },
            ])

            const comingSoon = sortComingSoonByDate(
                excludeAvailableOnVixsrc(
                    keepNotableComingSoon(keepFutureReleases(merged, from)),
                    movieIds,
                    tvIds
                )
            ).slice(0, 40)

            await cache.set(cacheKey, comingSoon, { ttl: this.CACHE_TTL })
            logger.info('In arrivo recuperati', {
                count: comingSoon.length,
                from,
                to,
            })

            return comingSoon.slice(0, limit)
        } catch (error) {
            logger.error('Errore nel recupero in arrivo', { error })
            return []
        }
    }

    async getEditorialRails(
        occupied: Array<{ id: number; type?: 'movie' | 'tv' }> = [],
        size = EDITORIAL_RAIL_SIZE
    ): Promise<EditorialRails> {
        const cacheKey = `editorial-rails-v3:${occupiedKeys(occupied).sort().join(',')}`
        const cached = await cache.get<EditorialRails>(cacheKey)
        if (cached) {
            return this.decorateEditorialRails(cached)
        }

        try {
            const warKeywords = keywordPipe(WAR_KEYWORDS)
            const politicsKeywords = keywordPipe(POLITICS_KEYWORDS)
            const periodKeywords = keywordPipe(PERIOD_KEYWORDS)
            const periodMovieGenres = `${TMDB_GENRE.movieHistory}|${TMDB_GENRE.movieWestern}`

            const [warMovies, warShows, intrigueShows, periodMovies, periodKeywordMovies, periodShows] =
                await Promise.all([
                this.discoverPages('movie', {
                    with_genres: TMDB_GENRE.movieWar,
                    sort_by: 'popularity.desc',
                    'vote_count.gte': 200,
                    include_adult: false,
                }),
                this.discoverPages('tv', {
                    with_keywords: warKeywords,
                    sort_by: 'popularity.desc',
                    'vote_count.gte': 80,
                }),
                this.discoverPages('tv', {
                    with_keywords: politicsKeywords,
                    without_keywords: warKeywords,
                    sort_by: 'popularity.desc',
                    'vote_count.gte': 80,
                }, 3),
                this.discoverPages(
                    'movie',
                    {
                        with_genres: periodMovieGenres,
                        sort_by: 'popularity.desc',
                        'vote_count.gte': 40,
                        include_adult: false,
                    },
                    4
                ),
                this.discoverPages('movie', {
                    with_keywords: periodKeywords,
                    sort_by: 'popularity.desc',
                    'vote_count.gte': 40,
                    include_adult: false,
                }, 4),
                this.discoverPages('tv', {
                    with_keywords: periodKeywords,
                    sort_by: 'popularity.desc',
                    'vote_count.gte': 20,
                }, 4),
            ])

            const [warAndPolitics, politicalIntrigue, periodStories] = await Promise.all([
                this.filterAvailableMixed([...warMovies, ...warShows]),
                this.filterAvailableMixed(intrigueShows),
                this.filterAvailableMixed([...periodMovies, ...periodKeywordMovies, ...periodShows]),
            ])

            const rails = composeEditorialRails(
                { warAndPolitics, politicalIntrigue, periodStories },
                occupiedKeys(occupied),
                size
            )
            const decorated = this.decorateEditorialRails(rails)
            await cache.set(cacheKey, decorated, { ttl: this.CACHE_TTL })
            logger.info('Scaffali editoriali costruiti', {
                warAndPolitics: decorated.warAndPolitics.length,
                politicalIntrigue: decorated.politicalIntrigue.length,
                periodStories: decorated.periodStories.length,
            })
            return decorated
        } catch (error) {
            logger.error('Errore nella costruzione scaffali editoriali', { error })
            return { warAndPolitics: [], politicalIntrigue: [], periodStories: [] }
        }
    }

    private decorateEditorialRails(rails: EditorialRails): EditorialRails {
        return {
            warAndPolitics: this.decorateRailItems(rails.warAndPolitics),
            politicalIntrigue: this.decorateRailItems(rails.politicalIntrigue),
            periodStories: this.decorateRailItems(rails.periodStories),
        }
    }

    async getPersonalRails(
        history: HistorySeed[] = [],
        occupied: Array<{ id: number; type?: 'movie' | 'tv' }> = [],
        size = PERSONAL_RAIL_SIZE
    ): Promise<PersonalRails> {
        const fingerprint = [...history]
            .sort((left, right) => right.watchedAt - left.watchedAt)
            .slice(0, TASTE_WINDOW)
            .map((entry) => `${entry.type}:${entry.id}:${Math.round((entry.progress || 0) / 10)}`)
            .join(',')
        const cacheKey = `personal-rails-v2:${fingerprint || 'guest'}:${occupiedKeys(occupied).sort().join(',')}`
        const cached = await cache.get<PersonalRails>(cacheKey)
        if (cached) {
            return this.decoratePersonalRails(cached)
        }

        try {
            const recent = [...history]
                .sort((left, right) => right.watchedAt - left.watchedAt)
                .slice(0, TASTE_WINDOW)
            const features = (
                await Promise.all(recent.map((seed) => this.getTitleFeatures(seed)))
            ).filter((item): item is TitleFeatures => Boolean(item))
            const taste = buildTasteProfile(history, features)
            const now = new Date()
            const movieGenres = toDiscoverGenres(taste.topGenres, 'movie')
            const tvGenres = toDiscoverGenres(taste.topGenres, 'tv')
            const from5y = yearsAgoIso(5, now)

            const [picksPool, picksRelaxed, affinityBundle, treasuresPool] = await Promise.all([
                taste.personalized
                    ? this.discoverMixed(
                          {
                              movie: {
                                  sort_by: 'popularity.desc',
                                  'vote_count.gte': 400,
                                  'primary_release_date.gte': from5y,
                                  include_adult: false,
                                  ...(movieGenres.length ? { with_genres: genrePipe(movieGenres) } : {}),
                              },
                              tv: {
                                  sort_by: 'popularity.desc',
                                  'vote_count.gte': 400,
                                  'first_air_date.gte': from5y,
                                  ...(tvGenres.length ? { with_genres: genrePipe(tvGenres) } : {}),
                              },
                          },
                          2
                      )
                    : this.getGlobalTrending(PERSONAL_OVERFETCH),
                this.discoverMixed(
                    {
                        movie: {
                            sort_by: 'popularity.desc',
                            'vote_count.gte': 250,
                            include_adult: false,
                            ...(taste.personalized && movieGenres.length
                                ? { with_genres: genrePipe(movieGenres) }
                                : {}),
                        },
                        tv: {
                            sort_by: 'popularity.desc',
                            'vote_count.gte': 250,
                            ...(taste.personalized && tvGenres.length
                                ? { with_genres: genrePipe(tvGenres) }
                                : {}),
                        },
                    },
                    2
                ),
                taste.personalized
                    ? this.getAffinityPool(taste.seeds, taste.topKeywords)
                    : Promise.resolve({
                          items: [] as Top10Content[],
                          flags: new Map<string, AffinityFlags>(),
                      }),
                this.discoverMixed(
                    {
                        movie: {
                            sort_by: 'vote_average.desc',
                            'vote_average.gte': 7.3,
                            'vote_count.gte': 300,
                            include_adult: false,
                            ...(taste.personalized && movieGenres.length
                                ? { with_genres: genrePipe(movieGenres) }
                                : {}),
                        },
                        tv: {
                            sort_by: 'vote_average.desc',
                            'vote_average.gte': 7.3,
                            'vote_count.gte': 300,
                            ...(taste.personalized && tvGenres.length
                                ? { with_genres: genrePipe(tvGenres) }
                                : {}),
                        },
                    },
                    2
                ),
            ])

            const [picks, relaxed, affinityItems, treasures] = await Promise.all([
                this.filterAvailableMixed(picksPool),
                this.filterAvailableMixed(picksRelaxed),
                this.filterAvailableMixed(affinityBundle.items),
                this.filterAvailableMixed(treasuresPool),
            ])

            const rails = composePersonalRails(
                {
                    picks,
                    picksRelaxed: relaxed,
                    affinity: affinityItems,
                    affinityFlags: affinityBundle.flags,
                    treasures,
                },
                taste,
                occupiedKeys(occupied),
                now,
                size
            )
            const decorated = this.decoratePersonalRails(rails)
            await cache.set(cacheKey, decorated, { ttl: taste.personalized ? 900 : this.CACHE_TTL })
            logger.info('Scaffali personali costruiti', {
                personalized: decorated.personalized,
                picks: decorated.picks.length,
                affinity: decorated.affinity.length,
                treasures: decorated.treasures.length,
            })
            return decorated
        } catch (error) {
            logger.error('Errore nella costruzione scaffali personali', { error })
            return { personalized: false, picks: [], affinity: [], treasures: [] }
        }
    }

    private decoratePersonalRails(rails: PersonalRails): PersonalRails {
        return {
            ...rails,
            picks: this.decorateRailItems(rails.picks),
            affinity: this.decorateRailItems(rails.affinity),
            treasures: this.decorateRailItems(rails.treasures),
        }
    }

    private decorateRailItems(items: Top10Content[]): Top10Content[] {
        return items.map((item) => ({
            ...item,
            title: item.title || item.name || '',
            name: item.name || item.title,
            tmdb_id: item.tmdb_id ?? item.id,
            contentType: item.type,
        })) as Top10Content[]
    }

    private mapRailItems(items: TmdbRailItem[] | undefined, type: 'movie' | 'tv'): Top10Content[] {
        const result: Top10Content[] = []
        const seen = new Set<string>()
        for (const raw of items || []) {
            const mapped = mapTmdbItemToTop10({ ...raw, media_type: raw.media_type || type }, type)
            if (!mapped) {
                continue
            }
            const key = railItemKey(mapped.type, mapped.id)
            if (seen.has(key)) {
                continue
            }
            seen.add(key)
            result.push(mapped)
        }
        return result
    }

    private async discoverPages(
        kind: 'movie' | 'tv',
        params: Record<string, string | number | boolean>,
        pages = 2
    ): Promise<Top10Content[]> {
        const requests = Array.from({ length: pages }, (_, index) =>
            kind === 'movie'
                ? tmdbWrapperService.discoverMovies({ ...params, page: index + 1 })
                : tmdbWrapperService.discoverTVShows({ ...params, page: index + 1 })
        )
        const responses = await Promise.all(requests)
        return responses.flatMap((response) =>
            this.mapRailItems((response?.results || []) as TmdbRailItem[], kind)
        )
    }

    private async discoverMixed(
        params: {
            movie: Record<string, string | number | boolean>
            tv: Record<string, string | number | boolean>
        },
        pages = 2
    ): Promise<Top10Content[]> {
        const requests = Array.from({ length: pages }, (_, index) => [
            tmdbWrapperService.discoverMovies({ ...params.movie, page: index + 1 }),
            tmdbWrapperService.discoverTVShows({ ...params.tv, page: index + 1 }),
        ]).flat()
        const responses = await Promise.all(requests)
        const mapped: Top10Content[] = []
        responses.forEach((response, index) => {
            const type = index % 2 === 0 ? 'movie' : 'tv'
            mapped.push(...this.mapRailItems((response?.results || []) as TmdbRailItem[], type))
        })
        return mapped
    }

    private parseKeywordIds(
        payload:
            | Array<{ id: number }>
            | { keywords?: Array<{ id: number }>; results?: Array<{ id: number }> }
            | undefined
    ) {
        const list = Array.isArray(payload)
            ? payload
            : payload?.keywords || payload?.results || []
        return list.map((item) => item.id).filter((id) => Number.isFinite(id) && id > 0)
    }

    private async getTitleFeatures(seed: HistorySeed): Promise<TitleFeatures | null> {
        const cacheKey = `tmdb-features-${seed.type}-${seed.id}`
        const cached = await cache.get<TitleFeatures>(cacheKey)
        if (cached) {
            return cached
        }

        const details =
            seed.type === 'movie'
                ? await tmdbWrapperService.getMovieDetails(seed.id, { append_to_response: 'keywords' })
                : await tmdbWrapperService.getTVShowDetails(seed.id, { append_to_response: 'keywords' })
        if (!details) {
            return null
        }

        const genreIds =
            Array.isArray(details.genre_ids) && details.genre_ids.length
                ? details.genre_ids
                : ((details.genres || []) as Array<{ id: number }>).map((genre) => genre.id)
        const feature: TitleFeatures = {
            id: seed.id,
            type: seed.type,
            genreIds: genreIds.filter((id: number) => Number.isFinite(id) && id > 0),
            keywordIds: this.parseKeywordIds(
                (details as { keywords?: { keywords?: Array<{ id: number }>; results?: Array<{ id: number }> } })
                    .keywords
            ),
            title: seed.type === 'tv' ? details.name || details.title : details.title || details.name,
        }
        await cache.set(cacheKey, feature, { ttl: 7 * 86_400 })
        return feature
    }

    private async getAffinityPool(
        seeds: HistorySeed[],
        keywordIds: number[]
    ): Promise<{ items: Top10Content[]; flags: Map<string, AffinityFlags> }> {
        const seedRequests = seeds.map(async (seed) => {
            const [recommendations, similar] =
                seed.type === 'movie'
                    ? await Promise.all([
                          tmdbWrapperService.getMovieRecommendations(seed.id),
                          tmdbWrapperService.getMovieSimilar(seed.id),
                      ])
                    : await Promise.all([
                          tmdbWrapperService.getTVRecommendations(seed.id),
                          tmdbWrapperService.getTVSimilar(seed.id),
                      ])
            return [
                {
                    items: this.mapRailItems((recommendations?.results || []) as TmdbRailItem[], seed.type),
                    flags: { seed: 1, keyword: false } satisfies AffinityFlags,
                },
                {
                    items: this.mapRailItems((similar?.results || []) as TmdbRailItem[], seed.type),
                    flags: { seed: 0.5, keyword: false } satisfies AffinityFlags,
                },
            ]
        })

        const keywordRequest =
            keywordIds.length >= 2
                ? this.discoverMixed(
                      {
                          movie: {
                              with_keywords: keywordIds.join('|'),
                              sort_by: 'popularity.desc',
                              'vote_count.gte': 150,
                              include_adult: false,
                          },
                          tv: {
                              with_keywords: keywordIds.join('|'),
                              sort_by: 'popularity.desc',
                              'vote_count.gte': 150,
                          },
                      },
                      1
                  )
                : Promise.resolve([] as Top10Content[])

        const [seedBuckets, keywordItems] = await Promise.all([Promise.all(seedRequests), keywordRequest])
        const flags = new Map<string, AffinityFlags>()
        const items: Top10Content[] = []
        const seen = new Set<string>()

        const absorb = (batch: Top10Content[], next: AffinityFlags) => {
            for (const item of batch) {
                const key = railItemKey(item.type, item.id)
                const previous = flags.get(key)
                flags.set(key, {
                    seed: Math.max(previous?.seed ?? 0, next.seed),
                    keyword: Boolean(previous?.keyword || next.keyword),
                })
                if (seen.has(key)) {
                    continue
                }
                seen.add(key)
                items.push(item)
            }
        }

        for (const pair of seedBuckets) {
            for (const bucket of pair) {
                absorb(bucket.items, bucket.flags)
            }
        }
        absorb(keywordItems, { seed: 0, keyword: true })

        return { items, flags }
    }

    private async filterAvailableMixed(items: Top10Content[]): Promise<Top10Content[]> {
        const [movieIds, tvIds] = await Promise.all([getVixsrcIdSet('movie'), getVixsrcIdSet('tv')])
        return items.filter((item) => {
            const pool = item.type === 'tv' ? tvIds : movieIds
            if (pool.size === 0) {
                return true
            }
            return pool.has(contentTmdbId(item))
        })
    }

    // Nuovo metodo per film popolari (recenti e di successo)
    async getPopularMovies(): Promise<Movie[]> {
        try {
            const cacheKey = 'popular-movies-v2'
            const cached = await cache.get<Movie[]>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa direttamente TMDB API per i film popolari
            const [page1, page2] = await Promise.all([
                tmdbWrapperService.getPopularMovies(1),
                tmdbWrapperService.getPopularMovies(2),
            ])
            const seen = new Set<number>()
            const movies = [...(page1?.results || []), ...(page2?.results || [])]
                .filter((tmdbMovie) => {
                    if (seen.has(tmdbMovie.id)) {
                        return false
                    }
                    seen.add(tmdbMovie.id)
                    return true
                })
                .map((tmdbMovie) => this.convertTMDBMovieToMovie(tmdbMovie))
            const available = await this.filterAvailableMovies(movies)
            await cache.set(cacheKey, available, { ttl: this.CACHE_TTL })
            logger.info('Film popolari recuperati con successo', { count: available.length })
            return available
        } catch (error) {
            logger.error('Errore nel recupero film popolari', { error })
            return []
        }
    }

    // Nuovo metodo per film recenti (ultimi 2 anni)
    async getRecentMovies(): Promise<Movie[]> {
        try {
            const cacheKey = 'recent-movies'
            const cached = await cache.get<Movie[]>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa direttamente TMDB API per i film recenti
            const response = await tmdbWrapperService.getUpcomingMovies()

            if (response && response.results) {
                const movies = response.results.map(tmdbMovie => this.convertTMDBMovieToMovie(tmdbMovie))
                const available = await this.filterAvailableMovies(movies)
                await cache.set(cacheKey, available, { ttl: this.CACHE_TTL })
                logger.info('Film recenti recuperati con successo', { count: available.length })
                return available
            }

            return []
        } catch (error) {
            logger.error('Errore nel recupero film recenti', { error })
            return []
        }
    }

    async getMovies(filters: CatalogFilters = { page: 1 }): Promise<PaginatedResponse<Movie>> {
        try {
            const cacheKey = this.generateCacheKey('movies_v2', filters)

            // Controlla la cache
            const cached = await cache.get<PaginatedResponse<Movie>>(cacheKey)
            if (cached) {
                return cached
            }

            // Prova prima con l'API di vixsrc.to
            try {
                const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/list/movie?lang=it`)

                if (response.status === 200 && Array.isArray(response.data)) {
                    const tmdbIds = collectVixsrcTmdbIds(response.data, 40)

                    // Ottimizzazione: parallelizzazione delle chiamate TMDB con batch processing
                    const batchSize = 5 // Processa 5 film alla volta per evitare rate limiting
                    const movies: Movie[] = []

                    for (let i = 0; i < Math.min(tmdbIds.length, 40); i += batchSize) {
                        const batch = tmdbIds.slice(i, i + batchSize)

                        const batchResults = await Promise.allSettled(
                            batch.map(async (tmdbId: number) => {
                                try {
                                    // Usa TMDB API per ottenere i dettagli reali
                                    const tmdbDetails = await tmdbWrapperService.getMovieDetails(tmdbId)
                                    if (tmdbDetails) {
                                        logger.info('Dettagli film ottenuti da TMDB', { tmdbId, title: tmdbDetails.title })
                                        return tmdbDetails
                                    }
                                } catch (error) {
                                    logger.warn('Errore nel recupero dettagli TMDB per film', { tmdbId, error })
                                }

                                // Fallback: usa dati minimi ma con ID reale per la riproduzione
                                return {
                                    id: tmdbId,
                                    title: `Film ${tmdbId}`,
                                    overview: `Film disponibile su vixsrc.to con ID ${tmdbId}. Per ottenere i dettagli completi, configura una chiave TMDB API valida.`,
                                    release_date: '',
                                    vote_average: 0,
                                    vote_count: 0,
                                    genre_ids: [],
                                    adult: false,
                                    original_language: 'en',
                                    original_title: `Film ${tmdbId}`,
                                    popularity: 0,
                                    video: false,
                                    tmdb_id: tmdbId,
                                    poster_path: '/placeholder-movie.svg',
                                    backdrop_path: '/placeholder-movie.svg'
                                }
                            })
                        )

                        // Aggiungi solo i risultati riusciti
                        batchResults.forEach(result => {
                            if (result.status === 'fulfilled') {
                                movies.push(this.convertTMDBMovieToMovie(result.value))
                            }
                        })

                        // Piccola pausa tra i batch per evitare rate limiting
                        if (i + batchSize < Math.min(tmdbIds.length, 20)) {
                            await new Promise(resolve => setTimeout(resolve, 100))
                        }
                    }

                    // Ordina i film secondo i filtri specificati
                    if (filters.sortBy && movies.length > 0) {
                        movies.sort((a, b) => {
                            let aValue: any
                            let bValue: any

                            switch (filters.sortBy) {
                                case 'popularity':
                                    aValue = a.popularity || 0
                                    bValue = b.popularity || 0
                                    break
                                case 'vote_average':
                                    aValue = a.vote_average || 0
                                    bValue = b.vote_average || 0
                                    break
                                case 'release_date':
                                    aValue = a.release_date ? new Date(a.release_date).getTime() : 0
                                    bValue = b.release_date ? new Date(b.release_date).getTime() : 0
                                    break
                                case 'title':
                                    aValue = a.title?.toLowerCase() || ''
                                    bValue = b.title?.toLowerCase() || ''
                                    break
                                default:
                                    return 0
                            }

                            if (filters.sortOrder === 'asc') {
                                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
                            } else {
                                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
                            }
                        })
                    }

                    const result: PaginatedResponse<Movie> = {
                        page: filters.page || 1,
                        results: movies,
                        total_pages: Math.ceil(tmdbIds.length / 20),
                        total_results: tmdbIds.length
                    }

                    // Salva in cache
                    await cache.set(cacheKey, result, { ttl: this.CACHE_TTL })

                    logger.info('Film recuperati con successo da vixsrc.to', { count: movies.length, filters })
                    return result
                }
            } catch (apiError) {
                logger.warn('Errore API vixsrc.to, usando dati mock', { error: apiError, filters })
            }

            // Fallback a dati mock se l'API non funziona
            logger.info('Usando dati mock per i film', { filters })
            const mockData: PaginatedResponse<Movie> = {
                page: filters.page || 1,
                results: this.getMockMovies(),
                total_pages: 1,
                total_results: this.getMockMovies().length
            }

            // Salva in cache
            await cache.set(cacheKey, mockData, { ttl: this.CACHE_TTL })

            logger.info('Film mock recuperati con successo', { count: mockData.results.length, filters })
            return mockData

            /* Commentiamo temporaneamente l'integrazione con vixsrc.to
            // Costruisce i parametri per l'API
            const params = new URLSearchParams()
            params.append('lang', filters.language || 'it')
            if (filters.genre) params.append('genre', filters.genre.toString())
            if (filters.year) params.append('year', filters.year.toString())
            if (filters.sortBy) params.append('sort_by', filters.sortBy)
            if (filters.sortOrder) params.append('sort_order', filters.sortOrder)
            if (filters.page) params.append('page', filters.page.toString())

            const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/list/movie?${params}`)

            if (response.status !== 200) {
                throw new Error(`Errore API: ${response.status}`)
            }

            const data = response.data

            // vixsrc.to restituisce un array diretto di tmdb_id
            if (Array.isArray(data) && data.length > 0) {
                // Converti i tmdb_id in oggetti Movie mock
                const movies = data.slice(0, 20).map((item: any, index: number) => {
                    const mockMovies = this.getMockMovies()
                    return {
                        ...mockMovies[index % mockMovies.length],
                        id: item.tmdb_id || (index + 1),
                        tmdb_id: item.tmdb_id
                    }
                })

                const result: PaginatedResponse<Movie> = {
                    page: filters.page || 1,
                    results: movies,
                    total_pages: Math.ceil(data.length / 20),
                    total_results: data.length
                }

                // Salva in cache
                await cache.set(cacheKey, result, { ttl: this.CACHE_TTL })

                logger.info('Film recuperati con successo da vixsrc.to', { count: movies.length, filters })
                return result
            }
            */
        } catch (error) {
            logger.error('Errore nel recupero film, usando dati mock', { error, filters })

            // Ritorna dati mock quando l'API esterna fallisce
            const mockData: PaginatedResponse<Movie> = {
                page: filters.page || 1,
                results: this.getMockMovies(),
                total_pages: 1,
                total_results: this.getMockMovies().length
            }

            return mockData
        }
    }

    async getTVShows(filters: CatalogFilters = { page: 1 }): Promise<PaginatedResponse<TVShow>> {
        try {
            const cacheKey = this.generateCacheKey('tv_v2', filters)

            // Controlla la cache
            const cached = await cache.get<PaginatedResponse<TVShow>>(cacheKey)
            if (cached) {
                return cached
            }

            // Prova prima con l'API di vixsrc.to
            try {
                const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/list/tv?lang=it`)

                if (response.status === 200 && Array.isArray(response.data)) {
                    const tmdbIds = collectVixsrcTmdbIds(response.data, 40)

                    // Ottimizzazione: parallelizzazione delle chiamate TMDB con batch processing
                    const batchSize = 5 // Processa 5 serie TV alla volta per evitare rate limiting
                    const tvShows: TVShow[] = []

                    for (let i = 0; i < Math.min(tmdbIds.length, 40); i += batchSize) {
                        const batch = tmdbIds.slice(i, i + batchSize)

                        const batchResults = await Promise.allSettled(
                            batch.map(async (tmdbId: number) => {
                                try {
                                    // Usa TMDB API per ottenere i dettagli reali
                                    const tmdbDetails = await tmdbWrapperService.getTVShowDetails(tmdbId)
                                    if (tmdbDetails) {
                                        logger.info('Dettagli serie TV ottenuti da TMDB', { tmdbId, name: tmdbDetails.name })
                                        return tmdbDetails
                                    }
                                } catch (error) {
                                    logger.warn('Errore nel recupero dettagli TMDB per serie TV', { tmdbId, error })
                                }

                                // Fallback: usa dati minimi ma con ID reale per la riproduzione
                                return {
                                    id: tmdbId,
                                    name: `Serie TV ${tmdbId}`,
                                    overview: `Serie TV disponibile su vixsrc.to con ID ${tmdbId}. Per ottenere i dettagli completi, configura una chiave TMDB API valida.`,
                                    first_air_date: '',
                                    vote_average: 0,
                                    vote_count: 0,
                                    genre_ids: [],
                                    adult: false,
                                    origin_country: [],
                                    original_language: 'en',
                                    original_name: `Serie TV ${tmdbId}`,
                                    popularity: 0,
                                    tmdb_id: tmdbId,
                                    poster_path: '/placeholder-movie.svg',
                                    backdrop_path: '/placeholder-movie.svg'
                                }
                            })
                        )

                        // Aggiungi solo i risultati riusciti
                        batchResults.forEach(result => {
                            if (result.status === 'fulfilled') {
                                tvShows.push(this.convertTMDBTVShowToTVShow(result.value))
                            }
                        })

                        // Piccola pausa tra i batch per evitare rate limiting
                        if (i + batchSize < Math.min(tmdbIds.length, 20)) {
                            await new Promise(resolve => setTimeout(resolve, 100))
                        }
                    }

                    // Ordina le serie TV secondo i filtri specificati
                    if (filters.sortBy && tvShows.length > 0) {
                        tvShows.sort((a, b) => {
                            let aValue: any
                            let bValue: any

                            switch (filters.sortBy) {
                                case 'popularity':
                                    aValue = a.popularity || 0
                                    bValue = b.popularity || 0
                                    break
                                case 'vote_average':
                                    aValue = a.vote_average || 0
                                    bValue = b.vote_average || 0
                                    break
                                case 'release_date':
                                    // Per serie TV usa first_air_date invece di release_date
                                    aValue = a.first_air_date ? new Date(a.first_air_date).getTime() : 0
                                    bValue = b.first_air_date ? new Date(b.first_air_date).getTime() : 0
                                    break
                                case 'title':
                                    aValue = a.name?.toLowerCase() || ''
                                    bValue = b.name?.toLowerCase() || ''
                                    break
                                default:
                                    return 0
                            }

                            if (filters.sortOrder === 'asc') {
                                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
                            } else {
                                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
                            }
                        })
                    }

                    const result: PaginatedResponse<TVShow> = {
                        page: filters.page || 1,
                        results: tvShows,
                        total_pages: Math.ceil(tmdbIds.length / 20),
                        total_results: tmdbIds.length
                    }

                    // Salva in cache
                    await cache.set(cacheKey, result, { ttl: this.CACHE_TTL })

                    logger.info('Serie TV recuperate con successo da vixsrc.to', { count: tvShows.length, filters })
                    return result
                }
            } catch (apiError) {
                logger.warn('Errore API vixsrc.to per serie TV, usando dati mock', { error: apiError, filters })
            }

            // Fallback a dati mock se l'API non funziona
            logger.info('Usando dati mock per le serie TV', { filters })
            const mockData: PaginatedResponse<TVShow> = {
                page: filters.page || 1,
                results: this.getMockTVShows(),
                total_pages: 1,
                total_results: this.getMockTVShows().length
            }

            // Salva in cache
            await cache.set(cacheKey, mockData, { ttl: this.CACHE_TTL })

            logger.info('Serie TV mock recuperate con successo', { count: mockData.results.length, filters })
            return mockData
        } catch (error) {
            logger.error('Errore nel recupero serie TV, usando dati mock', { error, filters })

            // Ritorna dati mock quando l'API esterna fallisce
            const mockData: PaginatedResponse<TVShow> = {
                page: filters.page || 1,
                results: this.getMockTVShows(),
                total_pages: 1,
                total_results: this.getMockTVShows().length
            }

            return mockData
        }
    }



    async getPopularTVShows(page: number = 1): Promise<PaginatedResponse<TVShow>> {
        return this.getTVShows({ sortBy: 'popularity', sortOrder: 'desc', page })
    }

    async getLatestMovies(page: number = 1): Promise<PaginatedResponse<Movie>> {
        return this.getMovies({ sortBy: 'release_date', sortOrder: 'desc', page })
    }

    async getLatestTVShows(page: number = 1): Promise<PaginatedResponse<TVShow>> {
        return this.getTVShows({ sortBy: 'release_date', sortOrder: 'desc', page })
    }

    async getTopRatedMovies(page: number = 1): Promise<PaginatedResponse<Movie>> {
        return this.getMovies({ sortBy: 'vote_average', sortOrder: 'desc', page })
    }

    async getTopRatedTVShows(page: number = 1): Promise<PaginatedResponse<TVShow>> {
        return this.getTVShows({ sortBy: 'vote_average', sortOrder: 'desc', page })
    }

    async searchMovies(query: string, page: number = 1): Promise<PaginatedResponse<Movie>> {
        try {
            const cacheKey = this.generateCacheKey('search_movies', { query, page })

            // Controlla la cache
            const cached = await cache.get<PaginatedResponse<Movie>>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa TMDB API per la ricerca, poi tieni solo i titoli su VixSrc
            const ids = await getVixsrcIdSet('movie')
            const collected: Movie[] = []
            let tmdbPage = page
            let totalPages = 1
            let sourceTotal = 0

            while (collected.length < 20 && tmdbPage <= page + 2) {
                const response = await tmdbWrapperService.searchMovies(query, tmdbPage)
                if (!response?.results?.length) {
                    break
                }

                totalPages = response.total_pages
                sourceTotal = response.total_results
                const pageMovies = response.results
                    .filter((tmdbMovie) => ids.size === 0 || ids.has(tmdbMovie.id))
                    .map((tmdbMovie) => this.convertTMDBMovieToMovie(tmdbMovie))
                collected.push(...pageMovies)
                tmdbPage += 1
                if (tmdbPage > totalPages) {
                    break
                }
            }

            const result: PaginatedResponse<Movie> = {
                results: collected.slice(0, 20),
                page,
                total_pages: totalPages,
                total_results: ids.size === 0 ? sourceTotal : collected.length,
            }

            // Salva in cache
            await cache.set(cacheKey, result, { ttl: this.CACHE_TTL })

            logger.info('Ricerca film completata', { query, count: result.results.length })
            return result
        } catch (error) {
            logger.error('Errore nella ricerca film', { error, query })
            throw new Error('Errore nella ricerca film')
        }
    }

    async searchTVShows(query: string, page: number = 1): Promise<PaginatedResponse<TVShow>> {
        try {
            const cacheKey = this.generateCacheKey('search_tv', { query, page })

            // Controlla la cache
            const cached = await cache.get<PaginatedResponse<TVShow>>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa TMDB API per la ricerca, poi tieni solo le serie su VixSrc
            const ids = await getVixsrcIdSet('tv')
            const tvShowsRaw = await tmdbWrapperService.searchTVShows(query, page)
            const filtered = (tvShowsRaw || []).filter(
                (show: { id: number }) => ids.size === 0 || ids.has(show.id)
            )

            const result: PaginatedResponse<TVShow> = {
                results: filtered.map((tmdbTVShow: any) => this.convertTMDBTVShowToTVShow(tmdbTVShow)),
                page,
                total_pages: Math.ceil((filtered.length || 0) / 20),
                total_results: filtered.length || 0
            }

            // Salva in cache
            await cache.set(cacheKey, result, { ttl: this.CACHE_TTL })

            logger.info('Ricerca serie TV completata', { query, count: result.results.length })
            return result
        } catch (error) {
            logger.error('Errore nella ricerca serie TV', { error, query })
            throw new Error('Errore nella ricerca serie TV')
        }
    }

    async getGenres(type: 'movie' | 'tv'): Promise<Genre[]> {
        try {
            const cacheKey = `genres_${type}`

            // Controlla la cache
            const cached = await cache.get<Genre[]>(cacheKey)
            if (cached) {
                return cached
            }

            const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/genre/${type}/list?lang=it`)

            if (response.status !== 200) {
                throw new Error(`Errore API: ${response.status}`)
            }

            const data = response.data.genres || []

            // Salva in cache per 24 ore (i generi cambiano raramente)
            await cache.set(cacheKey, data, { ttl: 86400 })

            logger.info('Generi recuperati con successo', { type, count: data.length })

            return data
        } catch (error) {
            logger.error('Errore nel recupero generi', { error, type })
            throw new Error('Errore nel recupero dei generi')
        }
    }

    private async filterAvailableMovies(movies: Movie[]): Promise<Movie[]> {
        const ids = await getVixsrcIdSet('movie')
        if (ids.size === 0) {
            return movies
        }
        return filterByVixsrcIds(movies, ids)
    }

    private generateCacheKey(prefix: string, params: Record<string, any>): string {
        return cache.generateKey(prefix, params)
    }

    private getMockMovies(): Movie[] {
        return [
            {
                id: 1,
                title: "Inception",
                overview: "Un ladro esperto che ruba segreti dal subconscio durante lo stato di sogno.",
                poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
                backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
                release_date: "2010-07-16",
                vote_average: 8.4,
                vote_count: 30000,
                genre_ids: [28, 878, 53],
                adult: false,
                original_language: "en",
                original_title: "Inception",
                popularity: 100.0,
                video: false
            },
            {
                id: 2,
                title: "The Dark Knight",
                overview: "Batman deve accettare uno dei test psicologici e fisici più grandi della sua capacità di combattere l'ingiustizia.",
                poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
                backdrop_path: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
                release_date: "2008-07-18",
                vote_average: 9.0,
                vote_count: 25000,
                genre_ids: [28, 80, 18],
                adult: false,
                original_language: "en",
                original_title: "The Dark Knight",
                popularity: 95.0,
                video: false
            },
            {
                id: 3,
                title: "Pulp Fiction",
                overview: "Le vite di due killer, un pugile, una moglie di gangster e una coppia di rapinatori si intrecciano.",
                poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
                backdrop_path: "/4cDFJr4H1XN5Fz6zbcl5QNvxtLW.jpg",
                release_date: "1994-10-14",
                vote_average: 8.9,
                vote_count: 20000,
                genre_ids: [80, 18],
                adult: false,
                original_language: "en",
                original_title: "Pulp Fiction",
                popularity: 90.0,
                video: false
            },
            {
                id: 4,
                title: "The Godfather",
                overview: "La storia della famiglia Corleone, una delle più potenti famiglie criminali di New York.",
                poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
                backdrop_path: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
                release_date: "1972-03-24",
                vote_average: 9.2,
                vote_count: 18000,
                genre_ids: [80, 18],
                adult: false,
                original_language: "en",
                original_title: "The Godfather",
                popularity: 85.0,
                video: false
            },
            {
                id: 5,
                title: "Forrest Gump",
                overview: "La storia di Forrest Gump, un uomo con un QI basso ma con un cuore d'oro.",
                poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
                backdrop_path: "/7c9UVPPiTPltouxRVY6N9uugaVA.jpg",
                release_date: "1994-07-06",
                vote_average: 8.8,
                vote_count: 22000,
                genre_ids: [35, 18, 10749],
                adult: false,
                original_language: "en",
                original_title: "Forrest Gump",
                popularity: 80.0,
                video: false
            },
            {
                id: 6,
                title: "The Matrix",
                overview: "Un programmatore scopre che la realtà è una simulazione creata da macchine intelligenti.",
                poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
                backdrop_path: "/7u3pxc0K1wx32IleAkLv78MKgrw.jpg",
                release_date: "1999-03-30",
                vote_average: 8.7,
                vote_count: 24000,
                genre_ids: [28, 878],
                adult: false,
                original_language: "en",
                original_title: "The Matrix",
                popularity: 88.0,
                video: false
            },
            {
                id: 7,
                title: "Interstellar",
                overview: "Un gruppo di astronauti viaggia attraverso un buco nero per trovare un nuovo pianeta per l'umanità.",
                poster_path: "/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
                backdrop_path: "/5a4JdufDf2tripNyv7mrq8a1w0p.jpg",
                release_date: "2014-11-05",
                vote_average: 8.6,
                vote_count: 26000,
                genre_ids: [18, 878],
                adult: false,
                original_language: "en",
                original_title: "Interstellar",
                popularity: 92.0,
                video: false
            },
            {
                id: 8,
                title: "The Shawshank Redemption",
                overview: "La storia di un banchiere condannato per omicidio che stringe amicizia con un altro detenuto.",
                poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
                backdrop_path: "/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg",
                release_date: "1994-09-23",
                vote_average: 9.3,
                vote_count: 28000,
                genre_ids: [18, 80],
                adult: false,
                original_language: "en",
                original_title: "The Shawshank Redemption",
                popularity: 87.0,
                video: false
            },
            {
                id: 9,
                title: "Fight Club",
                overview: "Un impiegato insoddisfatto forma un club segreto di combattimento con un venditore di sapone.",
                poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
                backdrop_path: "/87hTDiay2N2qWyX4Dx7dLITwXlo.jpg",
                release_date: "1999-10-15",
                vote_average: 8.8,
                vote_count: 21000,
                genre_ids: [18],
                adult: false,
                original_language: "en",
                original_title: "Fight Club",
                popularity: 83.0,
                video: false
            },
            {
                id: 10,
                title: "Goodfellas",
                overview: "La storia di Henry Hill e della sua vita nella mafia americana.",
                poster_path: "/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
                backdrop_path: "/sw7mordbZxgITU877yTpZCud90M.jpg",
                release_date: "1990-09-12",
                vote_average: 8.7,
                vote_count: 19000,
                genre_ids: [80, 18],
                adult: false,
                original_language: "en",
                original_title: "Goodfellas",
                popularity: 81.0,
                video: false
            }
        ]
    }

    private getMockTVShows(): TVShow[] {
        return [
            {
                id: 1,
                name: "Breaking Bad",
                overview: "Un insegnante di chimica malato di cancro si trasforma in un produttore di metanfetamine.",
                poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
                backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
                first_air_date: "2008-01-20",
                vote_average: 9.5,
                vote_count: 15000,
                genre_ids: [80, 18],
                adult: false,
                original_language: "en",
                original_name: "Breaking Bad",
                popularity: 95.0,
                origin_country: ["US"]
            },
            {
                id: 2,
                name: "Game of Thrones",
                overview: "Nove famiglie nobili lottano per il controllo delle terre di Westeros.",
                poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
                backdrop_path: "/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg",
                first_air_date: "2011-04-17",
                vote_average: 8.3,
                vote_count: 20000,
                genre_ids: [18, 14, 12],
                adult: false,
                original_language: "en",
                original_name: "Game of Thrones",
                popularity: 90.0,
                origin_country: ["US"]
            },
            {
                id: 3,
                name: "The Office",
                overview: "La vita quotidiana dei dipendenti di un'azienda di carta a Scranton, Pennsylvania.",
                poster_path: "/7DJKHzAi73O7btVhJqO7vL8jfzP.jpg",
                backdrop_path: "/7DJKHzAi73O7btVhJqO7vL8jfzP.jpg",
                first_air_date: "2005-03-24",
                vote_average: 8.5,
                vote_count: 12000,
                genre_ids: [35],
                adult: false,
                original_language: "en",
                original_name: "The Office",
                popularity: 85.0,
                origin_country: ["US"]
            },
            {
                id: 4,
                name: "Stranger Things",
                overview: "Un gruppo di bambini scopre segreti soprannaturali nella loro piccola città.",
                poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
                backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
                first_air_date: "2016-07-15",
                vote_average: 8.7,
                vote_count: 18000,
                genre_ids: [18, 14, 27],
                adult: false,
                original_language: "en",
                original_name: "Stranger Things",
                popularity: 88.0,
                origin_country: ["US"]
            },
            {
                id: 5,
                name: "The Walking Dead",
                overview: "Un gruppo di sopravvissuti cerca di sopravvivere in un mondo infestato da zombie.",
                poster_path: "/rqeYMLryjcawh2JeRpCVUDXYM5b.jpg",
                backdrop_path: "/wXXaPMgrv96NkH8KD1TMdS2d7iq.jpg",
                first_air_date: "2010-10-31",
                vote_average: 8.1,
                vote_count: 16000,
                genre_ids: [18, 27, 14],
                adult: false,
                original_language: "en",
                original_name: "The Walking Dead",
                popularity: 82.0,
                origin_country: ["US"]
            },
            {
                id: 6,
                name: "House of Cards",
                overview: "Un politico spietato e ambizioso sale al potere a Washington.",
                poster_path: "/hKWxWjFwnazd87h4FQf6tD5xVPR.jpg",
                backdrop_path: "/7Nwnmyzrtd0FkcRyPqmdzTPppQa.jpg",
                first_air_date: "2013-02-01",
                vote_average: 8.7,
                vote_count: 14000,
                genre_ids: [18, 80],
                adult: false,
                original_language: "en",
                original_name: "House of Cards",
                popularity: 86.0,
                origin_country: ["US"]
            },
            {
                id: 7,
                name: "Narcos",
                overview: "La storia del famoso cartello di droga di Pablo Escobar.",
                poster_path: "/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
                backdrop_path: "/tTfnd2VrlaZJSBD9HUbtSF3CqPJ.jpg",
                first_air_date: "2015-08-28",
                vote_average: 8.8,
                vote_count: 13000,
                genre_ids: [80, 18],
                adult: false,
                original_language: "en",
                original_name: "Narcos",
                popularity: 84.0,
                origin_country: ["US"]
            },
            {
                id: 8,
                name: "The Crown",
                overview: "La storia della regina Elisabetta II e della famiglia reale britannica.",
                poster_path: "/1M876Kj8VgHM2nKvqGq8VJ8vJ8v.jpg",
                backdrop_path: "/1M876Kj8VgHM2nKvqGq8VJ8vJ8v.jpg",
                first_air_date: "2016-11-04",
                vote_average: 8.6,
                vote_count: 11000,
                genre_ids: [18, 36],
                adult: false,
                original_language: "en",
                original_name: "The Crown",
                popularity: 79.0,
                origin_country: ["US"]
            }
        ]
    }
}
