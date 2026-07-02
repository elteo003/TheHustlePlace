'use client'

import Link from 'next/link'
import { MouseEvent, ReactNode } from 'react'
import { ContentType, getDetailsPath } from '@/lib/content-navigation'
import { cn } from '@/lib/utils'

interface DetailLinkProps {
    id: number
    type: ContentType
    children: ReactNode
    className?: string
    onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export function DetailLink({ id, type, children, className, onClick }: DetailLinkProps) {
    return (
        <Link href={getDetailsPath(id, type)} className={cn(className)} onClick={onClick}>
            {children}
        </Link>
    )
}
