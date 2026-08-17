'use client'

import { useState, useEffect } from 'react'
import { Play, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SeriesPlayerProps, Episode } from '@/types'
import { getTMDBImageUrl } from '@/lib/tmdb'
import { PosterTransition } from '@/components/ui/poster-transition'

export function SeriesPlayer({
    tvShow,
    currentSeason,
    currentEpisode,
    onSeasonChange,
    onEpisodeChange,
    onPlay,
    onAutoplayNext: _onAutoplayNext,
}: SeriesPlayerProps) {
    const [selectedSeason, setSelectedSeason] = useState(currentSeason)
    const [selectedEpisode, setSelectedEpisode] = useState(currentEpisode)
    const [showSeasonSelector, setShowSeasonSelector] = useState(false)

    const currentSeasonData = tvShow.seasons.find((s) => s.season_number === selectedSeason)
    const selectedEpisodeData = currentSeasonData?.episodes.find(
        (e) => e.episode_number === selectedEpisode
    )

    useEffect(() => {
        setSelectedSeason(currentSeason)
        setSelectedEpisode(currentEpisode)
    }, [currentSeason, currentEpisode])

    const handleSeasonChange = (seasonNumber: number) => {
        setSelectedSeason(seasonNumber)
        setSelectedEpisode(1)
        onSeasonChange(seasonNumber)
    }

    const getImageUrl = (path: string | null | undefined, size: 'w500' | 'w780' | 'original' = 'w500') => {
        if (!path || path === '/placeholder-movie.svg') {
            return '/placeholder-movie.svg'
        }
        return getTMDBImageUrl(path, size)
    }

    const formatRuntime = (minutes?: number) => {
        if (!minutes) return null
        return `${minutes} min`
    }

    return (
        <div className="min-h-screen bg-black text-white pt-16">
            <div className="relative h-[70vh]">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-50"
                    style={{
                        backgroundImage: `url(${getImageUrl(tvShow.backdrop_path, 'original')})`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div className="relative z-10 h-full flex items-end">
                    <div className="max-w-5xl mx-auto px-6 pb-14 w-full">
                        <div className="flex items-start gap-6">
                            <PosterTransition
                                type="tv"
                                id={tvShow.tmdb_id ?? tvShow.id}
                                className="relative flex-shrink-0 w-40 sm:w-48 aspect-[2/3]"
                            >
                                <Image
                                    src={getImageUrl(tvShow.poster_path, 'w500')}
                                    alt={tvShow.name}
                                    fill
                                    className="object-cover rounded-lg shadow-2xl"
                                    sizes="192px"
                                />
                            </PosterTransition>

                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight">
                                    {tvShow.name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-white/60 mb-4">
                                    <span>{tvShow.vote_average.toFixed(1)}</span>
                                    {tvShow.first_air_date && (
                                        <span>{new Date(tvShow.first_air_date).getFullYear()}</span>
                                    )}
                                    <span>
                                        {tvShow.seasons?.length || tvShow.number_of_seasons || 0} stagioni
                                    </span>
                                </div>

                                <p className="text-white/75 mb-6 max-w-2xl leading-relaxed">
                                    {tvShow.overview}
                                </p>

                                <Button
                                    size="lg"
                                    onClick={() => onPlay(selectedSeason, selectedEpisode)}
                                    className="btn-play gap-2"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Guarda
                                    {selectedEpisodeData ? ` S${selectedSeason}E${selectedEpisode}` : ''}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-10">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <h2 className="text-xl font-semibold">Episodi</h2>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowSeasonSelector(!showSeasonSelector)}
                                className="btn-ghost-outline text-sm py-2 px-3 inline-flex items-center gap-2"
                            >
                                Stagione {selectedSeason}
                                {showSeasonSelector ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>

                            {showSeasonSelector && (
                                <div className="absolute top-full left-0 mt-2 bg-zinc-950 border border-white/10 rounded-lg shadow-xl z-50 min-w-[200px] overflow-hidden">
                                    {tvShow.seasons.map((season) => (
                                        <button
                                            key={season.id}
                                            type="button"
                                            onClick={() => {
                                                handleSeasonChange(season.season_number)
                                                setShowSeasonSelector(false)
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                                season.season_number === selectedSeason
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            Stagione {season.season_number}
                                            <span className="block text-xs text-white/40 mt-0.5">
                                                {season.episodes?.length || season.episode_count} episodi
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {currentSeasonData && (
                        <div className="divide-y divide-white/10 border-t border-white/10">
                            {currentSeasonData.episodes.map((episode: Episode) => {
                                const active = episode.episode_number === selectedEpisode
                                return (
                                    <button
                                        key={episode.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedEpisode(episode.episode_number)
                                            onEpisodeChange(episode.episode_number)
                                            onPlay(selectedSeason, episode.episode_number)
                                        }}
                                        className={`w-full flex items-start gap-4 py-5 text-left transition-colors ${
                                            active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <span className="w-8 flex-shrink-0 text-white/35 text-lg font-medium pt-6">
                                            {episode.episode_number}
                                        </span>

                                        <div className="relative w-36 sm:w-44 aspect-video rounded-md overflow-hidden bg-zinc-900 flex-shrink-0 group">
                                            {episode.still_path ? (
                                                <Image
                                                    src={getImageUrl(episode.still_path, 'w500')}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                    sizes="176px"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-zinc-800" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play className="w-9 h-9 fill-white text-white" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex items-baseline justify-between gap-3 mb-1">
                                                <h3 className="font-medium text-white truncate">
                                                    {episode.name}
                                                </h3>
                                                {formatRuntime(episode.runtime) && (
                                                    <span className="text-xs text-white/40 flex-shrink-0">
                                                        {formatRuntime(episode.runtime)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-white/55 leading-relaxed line-clamp-3">
                                                {episode.overview?.trim() ||
                                                    'Nessuna trama disponibile per questo episodio.'}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
