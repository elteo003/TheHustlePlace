'use client'

import { PlatformChart, STUDIOS_AND_PLATFORMS } from '@/lib/platform-top10'

interface StudiosAndPlatformsRowProps {
    selectedSlug: string | null
    onSelectPlatform: (platform: PlatformChart) => void
    onResetToHome: () => void
    isLoading?: boolean
}

function PlatformLogo({ slug }: { slug: string }) {
    switch (slug) {
        case 'netflix':
            return (
                <span className="font-black text-2xl tracking-tighter text-[#E50914] drop-shadow-md select-none font-sans uppercase">
                    Netflix
                </span>
            )
        case 'amazon':
            return (
                <div className="flex flex-col items-center leading-none">
                    <span className="font-bold text-lg text-white tracking-tight lowercase">
                        prime <span className="font-normal text-sky-400">video</span>
                    </span>
                    <svg className="w-16 h-2.5 text-sky-400 -mt-0.5" viewBox="0 0 100 16" fill="currentColor">
                        <path d="M5 8 C 30 16, 70 16, 95 6 C 85 10, 50 14, 5 8 Z" />
                    </svg>
                </div>
            )
        case 'apple-tv':
            return (
                <div className="flex items-center gap-1.5 text-white">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.07-7.73-7.95-12.09-14.65-6.53-10.02-11.45-21.46-14.75-34.33-3.3-12.87-4.96-25.07-4.96-36.6 0-14.07 3.51-25.84 10.53-35.31 7.02-9.47 15.73-14.28 26.14-14.42 4.96 0 10.42 1.34 16.38 4.02 5.96 2.68 9.77 4.07 11.44 4.19 1.45 0 5.42-1.46 11.91-4.38 6.5-2.92 11.97-4.29 16.42-4.11 12.5.63 22.38 5.41 29.62 14.34-10.96 6.64-16.32 15.79-16.08 27.45.24 9.17 3.73 16.89 10.47 23.16 6.74 6.27 14.88 9.72 24.42 10.35-2.22 6.85-4.87 13.54-7.95 20.08zM119.22 33.15c0-7.25 2.66-14.15 7.99-20.7 5.33-6.55 11.83-10.74 19.51-12.57.24 1.13.36 2.14.36 3.03 0 7.37-2.82 14.46-8.47 21.28-5.65 6.82-12.19 10.8-19.63 11.93-.08-.97-.16-1.96-.16-2.97z" />
                    </svg>
                    <span className="font-semibold text-xl tracking-tight">tv+</span>
                </div>
            )
        case 'crunchyroll':
            return (
                <div className="flex items-center gap-2 text-[#F47521]">
                    <div className="w-5 h-5 rounded-full border-[3px] border-[#F47521] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F47521]" />
                    </div>
                    <span className="font-bold text-lg tracking-tight lowercase">crunchyroll</span>
                </div>
            )
        case 'disney':
            return (
                <div className="flex items-center text-white">
                    <span className="font-serif italic font-extrabold text-2xl tracking-tighter">Disney</span>
                    <span className="text-xl font-bold ml-0.5 text-blue-300">+</span>
                </div>
            )
        case 'hulu':
            return (
                <span className="font-extrabold text-2xl tracking-tighter text-[#1CE783] lowercase font-sans">
                    hulu
                </span>
            )
        case 'hbo':
            return (
                <div className="flex items-center text-white">
                    <span className="font-black text-2xl tracking-tight text-white font-sans uppercase">
                        HBO
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest bg-white/20 text-white rounded px-1.5 py-0.5 ml-1.5">
                        Max
                    </span>
                </div>
            )
        case 'paramount-plus':
            return (
                <div className="flex items-center gap-1 text-white">
                    <span className="font-serif italic font-bold text-lg tracking-tight">Paramount</span>
                    <span className="font-bold text-xl text-sky-400">+</span>
                </div>
            )
        case 'peacock':
            return (
                <div className="flex items-center gap-1.5 text-white">
                    <span className="font-bold text-lg tracking-tight">peacock</span>
                    <div className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                </div>
            )
        case 'discovery-plus':
            return (
                <div className="flex items-center gap-2 text-white">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-sky-400 p-[2px]">
                        <div className="w-full h-full bg-slate-900 rounded-full" />
                    </div>
                    <span className="font-medium text-sm tracking-tight">discovery<span className="font-bold text-sky-400">+</span></span>
                </div>
            )
        case 'now':
            return (
                <span className="font-black text-2xl tracking-wider text-[#00887A] font-sans uppercase">
                    NOW
                </span>
            )
        default:
            return <span className="font-bold text-base text-white">{slug}</span>
    }
}

export function StudiosAndPlatformsRow({
    selectedSlug,
    onSelectPlatform,
    onResetToHome,
    isLoading = false,
}: StudiosAndPlatformsRowProps) {
    return (
        <section className="content-gutter py-5 select-none">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        Studios & Platforms
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 overflow-x-auto py-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {STUDIOS_AND_PLATFORMS.map((platform) => {
                    const isCurrent = selectedSlug === platform.slug

                    if (isCurrent) {
                        return (
                            <button
                                key="the-hustle-place-reset"
                                type="button"
                                onClick={onResetToHome}
                                className="group relative shrink-0 w-[140px] sm:w-[160px] md:w-[176px] h-[78px] sm:h-[86px] md:h-[94px] rounded-2xl p-3 flex items-center justify-center will-change-transform transition-[transform,border-color,box-shadow] duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black border border-white/20 hover:border-white/40 bg-gradient-to-br from-[#1c1c24] via-[#121218] to-[#0a0a0f] hover:shadow-xl overflow-hidden"
                            >
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center shadow-sm">
                                        <span className="text-black font-black text-xs">H</span>
                                    </div>
                                    <span className="font-bold text-sm sm:text-base text-white tracking-tight">TheHustlePlace</span>
                                </div>
                            </button>
                        )
                    }

                    return (
                        <button
                            key={platform.slug}
                            type="button"
                            onClick={() => onSelectPlatform(platform)}
                            className="group relative shrink-0 w-[140px] sm:w-[160px] md:w-[176px] h-[78px] sm:h-[86px] md:h-[94px] rounded-2xl p-3 flex items-center justify-center will-change-transform transition-[transform,border-color,box-shadow] duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black border border-white/10 hover:border-white/30 bg-[#141418] hover:shadow-xl overflow-hidden"
                            style={{
                                background: `linear-gradient(145deg, ${platform.accentColor || '#1c1c24'}44 0%, #0d0d12 100%)`,
                            }}
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-200 pointer-events-none"
                                style={{ backgroundColor: platform.brandColor }}
                            />
                            <div className="relative z-10">
                                <PlatformLogo slug={platform.slug} />
                            </div>
                        </button>
                    )
                })}
            </div>
        </section>
    )
}
