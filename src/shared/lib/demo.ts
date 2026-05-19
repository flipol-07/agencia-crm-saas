export const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || process.env.DEMO_EMAIL || 'demo@aurie.local'

export function isDemoEmail(email?: string | null) {
    return Boolean(email && email.toLowerCase() === DEMO_EMAIL.toLowerCase())
}

export function shouldScopeToDemo(email?: string | null) {
    return isDemoEmail(email)
}
