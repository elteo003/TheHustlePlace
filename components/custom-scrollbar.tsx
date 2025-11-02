'use client'

import { useEffect, useRef, useState } from 'react'

interface CustomScrollbarProps {
    children: React.ReactNode
    className?: string
    containerClassName?: string
}

export function CustomScrollbar({ children, className = '', containerClassName = '' }: CustomScrollbarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const scrollbarTrackRef = useRef<HTMLDivElement>(null)
    const scrollbarThumbRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [thumbPosition, setThumbPosition] = useState(0)
    const [thumbWidth, setThumbWidth] = useState(0)
    const dragStartRef = useRef<number>(0)
    const scrollStartRef = useRef<number>(0)

    const updateScrollbar = () => {
        if (!scrollContainerRef.current || !scrollbarThumbRef.current) return

        const container = scrollContainerRef.current
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth
        const scrollLeft = container.scrollLeft
        const maxScroll = scrollWidth - clientWidth

        if (maxScroll <= 0) {
            setThumbWidth(0)
            return
        }

        const thumbWidthPercent = (clientWidth / scrollWidth) * 100
        const thumbLeftPercent = (scrollLeft / maxScroll) * (100 - thumbWidthPercent)

        setThumbWidth(thumbWidthPercent)
        setThumbPosition(thumbLeftPercent)
    }

    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        updateScrollbar()

        const handleScroll = () => {
            updateScrollbar()
        }

        const handleResize = () => {
            updateScrollbar()
        }

        container.addEventListener('scroll', handleScroll)
        window.addEventListener('resize', handleResize)

        // Usa MutationObserver per rilevare cambiamenti nel contenuto
        const observer = new MutationObserver(() => {
            updateScrollbar()
        })

        observer.observe(container, {
            childList: true,
            subtree: true,
            attributes: true
        })

        return () => {
            container.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', handleResize)
            observer.disconnect()
        }
    }, [])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollbarTrackRef.current || !scrollContainerRef.current) return

        e.preventDefault()
        setIsDragging(true)

        const track = scrollbarTrackRef.current
        const rect = track.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const trackWidth = rect.width
        const clickPercent = clickX / trackWidth

        const container = scrollContainerRef.current
        const maxScroll = container.scrollWidth - container.clientWidth
        const targetScroll = clickPercent * maxScroll

        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        })

        dragStartRef.current = clickX
        scrollStartRef.current = container.scrollLeft
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !scrollbarTrackRef.current || !scrollContainerRef.current) return

        const track = scrollbarTrackRef.current
        const rect = track.getBoundingClientRect()
        const deltaX = e.clientX - dragStartRef.current
        const trackWidth = rect.width
        const deltaPercent = deltaX / trackWidth

        const container = scrollContainerRef.current
        const maxScroll = container.scrollWidth - container.clientWidth
        const scrollDelta = deltaPercent * maxScroll

        container.scrollTo({
            left: scrollStartRef.current + scrollDelta,
            behavior: 'auto'
        })
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging])

    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === scrollbarThumbRef.current) return
        handleMouseDown(e)
    }

    if (thumbWidth === 0) {
        return (
            <div ref={scrollContainerRef} className={`overflow-x-hidden ${containerClassName}`}>
                {children}
            </div>
        )
    }

    return (
        <div
            className={`relative ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <style jsx>{`
                .scrollbar-track {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 6px;
                    background: transparent;
                    cursor: pointer;
                    z-index: 50;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .scrollbar-track:hover,
                .scrollbar-container:hover .scrollbar-track {
                    opacity: 1;
                }

                .scrollbar-thumb {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 6px;
                    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                    border-radius: 3px;
                    cursor: grab;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                    will-change: transform, box-shadow;
                }

                .scrollbar-thumb:hover {
                    background: linear-gradient(90deg, #2563eb, #7c3aed);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
                    transform: scaleY(1.2);
                    animation: glow 2s ease-in-out infinite;
                }

                .scrollbar-thumb:active {
                    cursor: grabbing;
                    transform: scaleY(1.3);
                    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.8);
                }

                @keyframes glow {
                    0%, 100% {
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
                    }
                    50% {
                        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.8);
                    }
                }

                .scrollbar-container:hover .scrollbar-thumb {
                    animation: glow 2s ease-in-out infinite;
                }
            `}</style>
            
            <div
                ref={scrollContainerRef}
                className={`scrollbar-container overflow-x-auto ${containerClassName}`}
                style={{
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                <style jsx global>{`
                    .scrollbar-container::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                {children}
            </div>

            <div
                ref={scrollbarTrackRef}
                className="scrollbar-track"
                onClick={handleTrackClick}
                style={{
                    opacity: isHovered ? 1 : 0
                }}
            >
                <div
                    ref={scrollbarThumbRef}
                    className="scrollbar-thumb"
                    style={{
                        width: `${thumbWidth}%`,
                        left: `${thumbPosition}%`,
                        transform: isDragging ? 'scaleY(1.3)' : isHovered ? 'scaleY(1.2)' : 'scaleY(1)'
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsDragging(true)
                        dragStartRef.current = e.clientX
                        if (scrollContainerRef.current) {
                            scrollStartRef.current = scrollContainerRef.current.scrollLeft
                        }
                    }}
                />
            </div>
        </div>
    )
}

