'use client'

import { TvFocus } from '@/tv/components/TvFocus'

const ROWS = [
    ['A', 'B', 'C', 'D', 'E', 'F'],
    ['G', 'H', 'I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P', 'Q', 'R'],
    ['S', 'T', 'U', 'V', 'W', 'X'],
    ['Y', 'Z', '0', '1', '2', '3'],
    ['4', '5', '6', '7', '8', '9'],
]

interface TvKeyboardProps {
    onChar: (value: string) => void
    onDelete: () => void
    onSubmit?: () => void
    submitLabel?: string
    includeSpace?: boolean
}

export function TvKeyboard({
    onChar,
    onDelete,
    onSubmit,
    submitLabel = 'OK',
    includeSpace = true,
}: TvKeyboardProps) {
    return (
        <div className="flex flex-col gap-2">
            {ROWS.map((row) => (
                <div key={row.join('')} className="flex justify-center gap-2">
                    {row.map((key) => (
                        <TvFocus
                            key={key}
                            onClick={() => onChar(key)}
                            className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-xl font-semibold text-white"
                        >
                            {key}
                        </TvFocus>
                    ))}
                </div>
            ))}
            <div className="mt-1 flex justify-center gap-2">
                {includeSpace && (
                    <TvFocus
                        onClick={() => onChar(' ')}
                        className="h-14 min-w-[9rem] rounded-lg bg-white/10 px-6 text-lg text-white"
                    >
                        Spazio
                    </TvFocus>
                )}
                <TvFocus
                    onClick={onDelete}
                    className="h-14 min-w-[7rem] rounded-lg bg-white/10 px-6 text-lg text-white"
                >
                    Canc
                </TvFocus>
                {onSubmit && (
                    <TvFocus
                        onClick={onSubmit}
                        className="h-14 min-w-[7rem] rounded-lg bg-white px-6 text-lg font-semibold text-black"
                    >
                        {submitLabel}
                    </TvFocus>
                )}
            </div>
        </div>
    )
}
