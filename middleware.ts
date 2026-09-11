import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    if (path === '/living' || path.startsWith('/living/')) {
        return NextResponse.rewrite(new URL('/tv-os.html', request.url))
    }
    return NextResponse.next()
}

export const config = {
    matcher: ['/living', '/living/:path*'],
}
