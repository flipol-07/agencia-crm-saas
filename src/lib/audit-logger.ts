import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type SecurityAction =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'PASSWORD_CHANGE'
    | 'PROFILE_UPDATE'
    | 'API_ACCESS_DENIED'
    | 'SENSITIVE_DATA_ACCESS'

export async function logSecurityEvent(
    userId: string | null,
    action: SecurityAction,
    resource: string,
    metadata: Record<string, any> = {}
) {
    try {
        const supabase = await createClient()
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || 'unknown'
        const userAgent = headersList.get('user-agent') || 'unknown'

        await supabase.from('security_audit_logs').insert({
            user_id: userId,
            action,
            resource,
            metadata: {
                ...metadata,
                user_agent: userAgent
            },
            ip_address: ip
        } as any)
    } catch (error) {
        // Fail silently to not impact user experience, but huge risk if logs fail.
        // In production, sync to external logger (e.g. Sentry) logic here.
        console.error('Failed to write security log:', error)
    }
}
