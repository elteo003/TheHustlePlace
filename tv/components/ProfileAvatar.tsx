import { avatarArtSrc, avatarColor, avatarInitial } from '@/tv/lib/avatars'
import { cn } from '@/lib/utils'

const ART_SHADOW =
    'drop-shadow(0 0 2px rgba(0,0,0,.9)) drop-shadow(0 8px 8px rgba(0,0,0,.75)) drop-shadow(0 18px 14px rgba(0,0,0,.45))'

export function ProfileAvatar({
    avatar,
    name,
    className,
    initialClassName,
}: {
    avatar: number
    name: string
    className?: string
    initialClassName?: string
}) {
    const src = avatarArtSrc(avatar)

    return (
        <span
            className={cn(
                'flex overflow-hidden',
                src ? 'items-end justify-center' : 'items-center justify-center',
                className
            )}
            style={{ background: avatarColor(avatar) }}
        >
            {src ? (
                <img
                    src={src}
                    alt=""
                    className="pointer-events-none h-[94%] w-[92%] object-contain object-bottom"
                    style={{ filter: ART_SHADOW }}
                />
            ) : (
                <span className={cn('font-semibold text-white', initialClassName)}>{avatarInitial(name)}</span>
            )}
        </span>
    )
}
