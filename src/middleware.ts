import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'


type CookieOptions = {
    name: string
    value: string
    options?: any
}

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: CookieOptions[]) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
            // Configurar duración de cookie para persistencia larga
            cookieOptions: {
                maxAge: 60 * 60 * 24 * 365, // 1 año (segundos)
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            }
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname;

    // Defines paths that are publicly accessible
    const publicPaths = [
        '/login',
        '/signup',
        '/auth/callback',
        '/reset-password',
        '/update-password'
    ];

    // Check if the current path is public
    const isPublicPath = publicPaths.some(publicPath =>
        path === publicPath || path.startsWith(publicPath + '/')
    );

    // ============================================
    // 🛡️ SECURITY: RATE LIMITING
    // ============================================
    if (path.startsWith('/api/') || path === '/login') {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        // Simple rate limit check via Supabase RPC (if implemented) or Edge Config
        // Note: Full DB rate limiting in Middleware can be slow. 
        // Ideally use Upstash/Redis. 
        // For now, we delegate to the API route itself OR use a lightweight check if possible.

        // Since we are in middleware (Edge), direct DB calls are tricky without proper setup.
        // We will SKIP DB-based rate limiting here to avoid latency issues in this MVP.
        // Instead, we rely on the implementation in specific API Routes (using lib/rate-limit.ts)
        // OR we implement a basic cookie-based or in-memory limiter (not persistent across lambdas).

        // RECOMMENDATION: Move rate limiting to individual API routes or per-server logic
        // to properly use our `rateLimit` helper which uses `createClient` (server).
        // Middleware `createServerClient` is for Auth mostly.
    }

    // ============================================
    // 🛡️ AUTHENTICATION WALL
    // ============================================

    // Si NO es ruta pública y NO hay usuario, redirigir a login
    if (!user && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Si YA hay usuario y trata de ir a login/signup, mandar al dashboard
    if (user && isPublicPath && !path.startsWith('/auth/callback')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Si es la raíz '/', redirigir según estado
    if (path === '/') {
        if (user) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc - handled by negative lookahead in regex)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|manifest|json)$).*)',
    ],
}
