import { Play } from 'lucide-react'

interface PlayMarkProps {
    className?: string
    iconClassName?: string
    pulse?: boolean
}

/** Disco play. `pulse` è un respiro lento su transform, spento con reduced-motion. */
export function PlayMark({
    className = 'w-12 h-12',
    iconClassName = 'w-5 h-5',
    pulse = false,
}: PlayMarkProps) {
    return (
        <span
            className={`inline-flex items-center justify-center rounded-full bg-white text-black shadow-lg ${
                pulse ? 'play-mark-pulse' : ''
            } ${className}`}
        >
            <Play className={`fill-current ml-0.5 ${iconClassName}`} />
        </span>
    )
}
