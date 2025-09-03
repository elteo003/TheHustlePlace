'use client'

import { Card } from '@/components/ui/card'

interface SkeletonLoaderProps {
    count?: number
    type?: 'movie' | 'hero' | 'text'
}

export function SkeletonLoader({ count = 1, type = 'movie' }: SkeletonLoaderProps) {
    const renderSkeleton = () => {
        switch (type) {
            case 'hero':
                return (
                    <div className="relative h-screen overflow-hidden">
                        <div className="absolute inset-0 bg-gray-800 animate-pulse"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="relative z-10 h-full flex items-center">
                            <div className="max-w-7xl mx-auto px-4 w-full">
                                <div className="max-w-2xl">
                                    <div className="h-16 bg-gray-700 rounded mb-6 animate-pulse"></div>
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                                        <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                                        <div className="h-4 w-12 bg-gray-700 rounded animate-pulse"></div>
                                    </div>
                                    <div className="h-20 bg-gray-700 rounded mb-8 animate-pulse"></div>
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-32 bg-gray-700 rounded animate-pulse"></div>
                                        <div className="h-12 w-12 bg-gray-700 rounded-full animate-pulse"></div>
                                        <div className="h-12 w-12 bg-gray-700 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            
            case 'text':
                return (
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                )
            
            default: // movie
                return (
                    <Card className="bg-transparent border-0 p-0">
                        <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                            <div className="w-full h-full bg-gray-700 animate-pulse"></div>
                        </div>
                        <div className="mt-3">
                            <div className="h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
                            <div className="flex items-center justify-between">
                                <div className="h-3 w-12 bg-gray-700 rounded animate-pulse"></div>
                                <div className="h-3 w-8 bg-gray-700 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </Card>
                )
        }
    }

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index}>
                    {renderSkeleton()}
                </div>
            ))}
        </>
    )
}
