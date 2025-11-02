'use client'

import { useState, useEffect } from 'react'
import { Play, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SeriesPlayerProps, Episode } from '@/types'
import { getTMDBImageUrl } from '@/lib/tmdb'
import { useAutoplay } from '@/hooks/useAutoplay'

export function SeriesPlayer({
    tvShow,
    currentSeason,
    currentEpisode,
    onSeasonChange,
    onEpisodeChange,
    onPlay,
    onAutoplayNext
}: SeriesPlayerProps) {
    const [selectedSeason, setSelectedSeason] = useState(currentSeason)
    const [selectedEpisode, setSelectedEpisode] = useState(currentEpisode)
    const [showSeasonSelector, setShowSeasonSelector] = useState(false)
    const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(new Set())

    // Hook per gestire l'autoplay
    const { handleEpisodeEnded } = useAutoplay({
        tvShow,
        currentSeason,
        currentEpisode,
        onSeasonChange,
        onEpisodeChange
    })

    const currentSeasonData = tvShow.seasons.find(s => s.season_number === selectedSeason)
    const currentEpisodeData = currentSeasonData?.episodes.find(e => e.episode_number === selectedEpisode)

    useEffect(() => {
        setSelectedSeason(currentSeason)
        setSelectedEpisode(currentEpisode)
    }, [currentSeason, currentEpisode])

    const handleSeasonChange = (seasonNumber: number) => {
        setSelectedSeason(seasonNumber)
        setSelectedEpisode(1) // Reset al primo episodio della nuova stagione
        onSeasonChange(seasonNumber)
    }

    const handleEpisodeChange = (episodeNumber: number) => {
        setSelectedEpisode(episodeNumber)
        onEpisodeChange(episodeNumber)
    }

    const handlePlay = (seasonNumber: number, episodeNumber: number) => {
        onPlay(seasonNumber, episodeNumber)
    }

    const handleEpisodeWatched = (episodeNumber: number) => {
        // Marca l'episodio come guardato
        setWatchedEpisodes(prev => {
            const newSet = new Set(prev)
            newSet.add(episodeNumber)
            return newSet
        })
    }

    const getImageUrl = (path: string | null | undefined, size: 'w500' | 'w780' | 'original' = 'w500') => {
        if (!path || path === '/placeholder-movie.svg') {
            return '/placeholder-movie.svg'
        }
        return getTMDBImageUrl(path, size)
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatRuntime = (minutes: number) => {
        if (!minutes) return 'N/A'
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <div className="relative h-[70vh] bg-gradient-to-r from-black via-black/50 to-transparent">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-50"
                    style={{
                        backgroundImage: `url(${getImageUrl(tvShow.backdrop_path, 'original')})`
                    }}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                {/* Content */}
                <div className="relative z-10 h-full flex items-end">
                    <div className="max-w-4xl mx-auto px-6 pb-16">
                        <div className="flex items-start space-x-6">
                            {/* Poster */}
                            <div className="flex-shrink-0">
                                <img
                                    src={getImageUrl(tvShow.poster_path, 'w500')}
                                    alt={tvShow.name}
                                    className="w-48 h-72 object-cover rounded-lg shadow-2xl"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h1 className="text-4xl font-bold mb-4">{tvShow.name}</h1>
                                
                                <div className="flex items-center space-x-4 mb-4 text-sm">
                                    <span className="text-green-400 font-semibold">
                                        {tvShow.vote_average.toFixed(1)} ⭐
                                    </span>
                                    <span>{formatDate(tvShow.first_air_date)}</span>
                                    <span>{tvShow.seasons?.length || tvShow.number_of_seasons || 0} stagioni</span>
                                    <span>
                                        {tvShow.seasons?.reduce((total, season) => total + (season.episodes?.length || 0), 0) || 
                                         tvShow.number_of_episodes || 0} episodi
                                    </span>
                                </div>

                                <p className="text-lg text-gray-300 mb-6 max-w-2xl leading-relaxed">
                                    {tvShow.overview}
                                </p>

                                <div className="flex items-center space-x-4">
                                    <Button
                                        size="lg"
                                        onClick={() => handlePlay(selectedSeason, selectedEpisode)}
                                        className="bg-gray-700 text-white border border-gray-400 hover:bg-gray-600 rounded-xl flex items-center space-x-2 px-6 py-3 shadow-lg"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        <span>Guarda ora</span>
                                    </Button>
                                    
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="border-white/30 text-white hover:bg-white/10 flex items-center space-x-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span>La mia lista</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Episodes Section */}
            <div className="px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Season Selector */}
                    <div className="mb-6">
                        <div className="flex items-center space-x-4 mb-4">
                            <h2 className="text-2xl font-bold">Episodi</h2>
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSeasonSelector(!showSeasonSelector)}
                                    className="border-white/30 text-white hover:bg-white/10 flex items-center space-x-2"
                                >
                                    <span>Stagione {selectedSeason}</span>
                                    {showSeasonSelector ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </Button>

                                {showSeasonSelector && (
                                    <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50 min-w-[200px]">
                                        {tvShow.seasons.map((season) => (
                                            <button
                                                key={season.id}
                                                onClick={() => {
                                                    handleSeasonChange(season.season_number)
                                                    setShowSeasonSelector(false)
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors ${
                                                    season.season_number === selectedSeason 
                                                        ? 'bg-white/20 text-white' 
                                                        : 'text-gray-300'
                                                }`}
                                            >
                                                <div className="font-medium">Stagione {season.season_number}</div>
                                                <div className="text-sm text-gray-400">
                                                    {season.episode_count} episodi
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Episodes List */}
                    {currentSeasonData && (
                        <div className="space-y-4">
                            {currentSeasonData.episodes.map((episode: Episode) => (
                                <div
                                    key={episode.id}
                                    className={`flex items-start space-x-4 p-4 rounded-lg transition-colors ${
                                        episode.episode_number === selectedEpisode
                                            ? 'bg-white/10 border border-white/20'
                                            : 'hover:bg-white/5'
                                    }`}
                                >
                                    {/* Episode Thumbnail */}
                                    <div className="flex-shrink-0">
                                        <div className="relative w-32 h-20 bg-gray-800 rounded overflow-hidden">
                                            {episode.still_path ? (
                                                <img
                                                    src={getImageUrl(episode.still_path, 'w500')}
                                                    alt={episode.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                    N/A
                                                </div>
                                            )}
                                            
                                            {/* Play Button Overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePlay(selectedSeason, episode.episode_number)}
                                                    className="bg-gray-700 text-white border border-gray-400 hover:bg-gray-600 rounded-xl px-4 py-2 shadow-lg"
                                                >
                                                    <Play className="w-4 h-4 fill-current" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Episode Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {episode.episode_number}. {episode.name}
                                                    </h3>
                                                    {watchedEpisodes.has(episode.episode_number) && (
                                                        <Check className="w-5 h-5 text-green-400" />
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                                                    <span>{formatDate(episode.air_date)}</span>
                                                    {episode.runtime && (
                                                        <span>{formatRuntime(episode.runtime)}</span>
                                                    )}
                                                    <span>⭐ {episode.vote_average.toFixed(1)}</span>
                                                </div>
                                                
                                                <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                                                    {episode.overview || 'Descrizione non disponibile'}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center space-x-2 ml-4">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePlay(selectedSeason, episode.episode_number)}
                                                    className="bg-gray-700 text-white border border-gray-400 hover:bg-gray-600 rounded-xl px-4 py-2 shadow-lg"
                                                >
                                                    <Play className="w-4 h-4 mr-1 fill-current" />
                                                    Guarda
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Season Completed Message */}
                    {currentSeasonData && selectedEpisode === currentSeasonData.episodes.length && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg text-center">
                            <h3 className="text-xl font-bold text-white mb-2">
                                🎉 Stagione {selectedSeason} completata!
                            </h3>
                            <p className="text-gray-300 mb-4">
                                Hai finito di guardare tutti gli episodi di questa stagione.
                            </p>
                            {selectedSeason < (tvShow.seasons?.length || tvShow.number_of_seasons || 0) && (
                                <Button
                                    onClick={() => handleSeasonChange(selectedSeason + 1)}
                                    className="bg-white text-black hover:bg-gray-200"
                                >
                                    Guarda Stagione {selectedSeason + 1}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
