'use client'

import Link from 'next/link'
import { MouseEvent, PointerEvent, ReactNode } from 'react'
import { ContentType, getDetailsPath } from '@/lib/content-navigation'
import { cn } from '@/lib/utils'

interface DetailLinkProps {
    id: number
    type: ContentType
    children: ReactNode
    className?: string
    onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
    onPointerDown?: (e: PointerEvent<HTMLAnchorElement>) => void
}

export function DetailLink({ id, type, children, className, onClick, onPointerDown }: DetailLinkProps) {
    return (
        <Link
            href={getDetailsPath(id, type)}
            className={cn(className)}
            onClick={onClick}
            onPointerDown={onPointerDown}
        >
            {children}
        </Link>
    )
}
