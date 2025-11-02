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
    const dragStartXRef = useRef<number>(0)
    const dragStartScrollRef = useRef<number>(0)

    const updateScrollbar = () => {
        if (!scrollContainerRef.current) return

        const container = scrollContainerRef.current
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth
        const scrollLeft = container.scrollLeft
        const maxScroll = scrollWidth - clientWidth

        if (maxScroll <= 0) {
            setThumbWidth(0)
            return
        }

        // Calcola la larghezza della thumb proporzionale al contenuto visibile
        const thumbWidthPercent = (clientWidth / scrollWidth) * 100
        setThumbWidth(Math.max(10, thumbWidthPercent)) // Minimo 10% per visibilità

        // Calcola la posizione della thumb basata sullo scroll
        const thumbLeftPercent = (scrollLeft / maxScroll) * (100 - thumbWidthPercent)
        setThumbPosition(Math.max(0, Math.min(100 - thumbWidthPercent, thumbLeftPercent)))
    }

    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        updateScrollbar()

        const handleScroll = () => {
            requestAnimationFrame(updateScrollbar)
        }

        const handleResize = () => {
            requestAnimationFrame(updateScrollbar)
        }

        container.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('resize', handleResize, { passive: true })

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateScrollbar)
        })
        
        resizeObserver.observe(container)

        return () => {
            container.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', handleResize)
            resizeObserver.disconnect()
        }
    }, [])

    // Gestione drag della thumb
    const handleThumbMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!scrollContainerRef.current) return
        
        setIsDragging(true)
        dragStartXRef.current = e.clientX
        dragStartScrollRef.current = scrollContainerRef.current.scrollLeft
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current || !scrollbarTrackRef.current) return

        const track = scrollbarTrackRef.current
        const rect = track.getBoundingClientRect()
        const deltaX = e.clientX - dragStartXRef.current
        const trackWidth = rect.width
        
        if (trackWidth === 0) return
        
        const container = scrollContainerRef.current
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth
        const maxScroll = scrollWidth - clientWidth
        
        if (maxScroll <= 0) return
        
        // Calcola lo scroll in base al movimento del mouse
        const scrollRatio = maxScroll / (trackWidth - (trackWidth * (thumbWidth / 100)))
        const newScrollLeft = Math.max(0, Math.min(maxScroll, dragStartScrollRef.current + (deltaX * scrollRatio)))
        
        container.scrollLeft = newScrollLeft
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

    // Gestione click sulla track
    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Se il click è sulla thumb, non fare nulla
        if (scrollbarThumbRef.current && scrollbarThumbRef.current.contains(e.target as Node)) {
            return
        }
        
        if (!scrollContainerRef.current || !scrollbarTrackRef.current) return
        
        const track = scrollbarTrackRef.current
        const rect = track.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const trackWidth = rect.width
        
        if (trackWidth === 0) return
        
        const container = scrollContainerRef.current
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth
        const maxScroll = scrollWidth - clientWidth
        
        if (maxScroll <= 0) return
        
        // Calcola la posizione target basata sul click (considerando la larghezza della thumb)
        const thumbWidthPx = (trackWidth * thumbWidth) / 100
        const trackWithoutThumb = trackWidth - thumbWidthPx
        const clickPercent = Math.max(0, Math.min(1, clickX / trackWidth))
        
        // Posiziona il centro della thumb dove hai cliccato
        const thumbCenterPercent = clickPercent
        const targetScrollPercent = thumbCenterPercent * (maxScroll / (scrollWidth - clientWidth))
        const targetScroll = targetScrollPercent * maxScroll
        
        container.scrollLeft = Math.max(0, Math.min(maxScroll, targetScroll))
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
            style={{ paddingBottom: '24px' }}
        >
            <style jsx>{`
                .custom-scrollbar-wrapper {
                    position: relative;
                }

                .custom-scrollbar-wrapper.dragging {
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                }

                .custom-scrollbar-wrapper.dragging * {
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    cursor: grabbing !important;
                }

                .scrollbar-track {
                    position: absolute;
                    bottom: -16px;
                    left: 0;
                    right: 0;
                    height: 8px;
                    background: transparent;
                    cursor: pointer;
                    z-index: 50;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: auto;
                    padding: 2px 0;
                }

                .scrollbar-track:hover {
                    opacity: 1;
                }

                .scrollbar-thumb {
                    position: absolute;
                    bottom: 2px;
                    left: 0;
                    height: 6px;
                    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                    border-radius: 3px;
                    cursor: grab;
                    transition: box-shadow 0.3s ease, background 0.3s ease;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                }

                .scrollbar-thumb:active {
                    cursor: grabbing;
                }

                .custom-scrollbar-wrapper:hover .scrollbar-thumb {
                    background: linear-gradient(90deg, #2563eb, #7c3aed);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
                    animation: glow 2s ease-in-out infinite;
                }

                .scrollbar-thumb:hover {
                    background: linear-gradient(90deg, #2563eb, #7c3aed);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
                }

                @keyframes glow {
                    0%, 100% {
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
                    }
                    50% {
                        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.8);
                    }
                }

                .scrollbar-container {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .scrollbar-container::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            
            <div className={`custom-scrollbar-wrapper ${isDragging ? 'dragging' : ''}`}>
                <div
                    ref={scrollContainerRef}
                    className={`scrollbar-container overflow-x-auto ${containerClassName}`}
                    style={{
                        scrollBehavior: 'smooth'
                    }}
                >
                    {children}
                </div>

                <div
                    ref={scrollbarTrackRef}
                    className="scrollbar-track"
                    onClick={handleTrackClick}
                >
                    <div
                        ref={scrollbarThumbRef}
                        className="scrollbar-thumb"
                        onMouseDown={handleThumbMouseDown}
                        style={{
                            width: `${thumbWidth}%`,
                            left: `${thumbPosition}%`
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
