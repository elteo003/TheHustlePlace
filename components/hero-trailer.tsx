'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { Movie } from '@/types'

interface HeroTrailerProps {
    movie: Movie
    isVisible: boolean
    onClose: () => void
}

export function HeroTrailer({ movie, isVisible, onClose }: HeroTrailerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Simula un trailer URL (in una app reale, questo verrebbe da un'API)
    const trailerUrl = movie.video ? `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4` : null

    useEffect(() => {
        if (isVisible && videoRef.current) {
            // Auto-play quando si apre il trailer
            videoRef.current.play().catch(console.error)
            setIsPlaying(true)
        }
    }, [isVisible])

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play().catch(console.error)
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime)
        }
    }

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (!isVisible || !trailerUrl) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center">
            <div className="relative w-full max-w-6xl mx-4">
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                    onClick={onClose}
                >
                    <X className="w-6 h-6" />
                </Button>

                {/* Video Container */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                        ref={videoRef}
                        src={trailerUrl}
                        className="w-full h-full object-cover"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        muted={isMuted}
                    />

                    {/* Video Controls Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                        {/* Top Controls */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                            <div className="text-white">
                                <h3 className="text-xl font-bold">{movie.title}</h3>
                                <p className="text-sm text-gray-300">Trailer</p>
                            </div>
                        </div>

                        {/* Center Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Button
                                size="lg"
                                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 w-20 h-20 rounded-full"
                                onClick={togglePlayPause}
                            >
                                {isPlaying ? (
                                    <Pause className="w-8 h-8" />
                                ) : (
                                    <Play className="w-8 h-8 ml-1" />
                                )}
                            </Button>
                        </div>

                        {/* Bottom Controls */}
                        <div className="absolute bottom-4 left-4 right-4">
                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="w-full h-1 bg-white/30 rounded-full">
                                    <div
                                        className="h-full bg-white rounded-full transition-all duration-200"
                                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:bg-white/20"
                                        onClick={togglePlayPause}
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-5 h-5" />
                                        ) : (
                                            <Play className="w-5 h-5" />
                                        )}
                                    </Button>

                                    <div className="flex items-center space-x-2 text-white text-sm">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>/</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:bg-white/20"
                                        onClick={toggleMute}
                                    >
                                        {isMuted ? (
                                            <VolumeX className="w-5 h-5" />
                                        ) : (
                                            <Volume2 className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Movie Info */}
                <div className="mt-4 text-white">
                    <h2 className="text-2xl font-bold mb-2">{movie.title}</h2>
                    <p className="text-gray-300 line-clamp-3">{movie.overview}</p>
                </div>
            </div>
        </div>
    )
}


