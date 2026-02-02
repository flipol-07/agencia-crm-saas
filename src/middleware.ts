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

    // Protección de rutas protegidas
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!user && request.nextUrl.pathname.startsWith('/contacts')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirección si ya está logueado
    if (user && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
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
         * - api (API routes, though we might want to protect them too, letting them pass for now as they usually handle their own 401s or use RLS)
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
