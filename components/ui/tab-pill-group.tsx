'use client'

import { LayoutGroup, motion } from 'framer-motion'
import { springTransition } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

export type TabPillItem<T extends string = string> = {
    id: T
    label: string
}

interface TabPillGroupProps<T extends string> {
    items: ReadonlyArray<TabPillItem<T>>
    value: T
    onChange: (id: T) => void
    layoutId: string
    className?: string
}

export function TabPillGroup<T extends string>({
    items,
    value,
    onChange,
    layoutId,
    className,
}: TabPillGroupProps<T>) {
    const reduceMotion = useReducedMotion()

    return (
        <LayoutGroup id={layoutId}>
            <div className={cn('tab-pill-group', className)}>
                {items.map((item) => {
                    const active = item.id === value
                    return (
                        <button
                            key={item.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                                if (item.id !== value) onChange(item.id)
                            }}
                            className={cn('tab-pill', active && 'tab-pill-active')}
                        >
                            {active ? (
                                reduceMotion ? (
                                    <span className="absolute inset-0 rounded-md bg-white" aria-hidden />
                                ) : (
                                    <motion.span
                                        layoutId={`${layoutId}-thumb`}
                                        className="absolute inset-0 rounded-md bg-white"
                                        transition={springTransition}
                                        aria-hidden
                                    />
                                )
                            ) : null}
                            <span className="relative z-10">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </LayoutGroup>
    )
}
