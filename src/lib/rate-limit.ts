import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

/**
 * Rate Limiter Configuration
 */
const WINDOW_SIZE_MS = 60 * 1000 // 1 minute window
const MAX_REQUESTS = 30 // 30 requests per minute by default

/**
 * Checks if the current request should be rate limited.
 * Uses the request IP address as the identifier.
 * 
 * @param identifier Optional identifier (e.g., user ID). Defaults to IP.
 * @param limit Max requests allowed in the window.
 * @returns { success: boolean, remaining: number }
 */
export async function rateLimit(identifier?: string, limit: number = MAX_REQUESTS) {
    const supabase = await createClient()

    // Get IP if no identifier provided
    let key = identifier
    if (!key) {
        const headersList = await headers()
        key = headersList.get('x-forwarded-for') || 'unknown'
    }

    // Normalize key
    key = `rate_limit:${key}`
    const now = Date.now()
    const clearTime = now + WINDOW_SIZE_MS

    // Simple implementation: UPSERT with expire logic
    // In a real high-traffic scenario, Redis is better.
    // Here we use PG for simplicity as per "Kiss" principle.

    // Atomic Increment via RPC
    const { error: rpcError } = await (supabase.rpc as any)('increment_rate_limit', {
        row_key: key,
        current_ts: now,
        window_expire: clearTime
    })

    if (rpcError) {
        console.error('RateLimit RPC Error:', rpcError)
        // Fallback or ignore for resilience
    }

    // 2. Get current state to return remaining count
    const { data: current } = await supabase
        .from('rate_limits')
        .select('points, expire_at')
        .eq('key', key)
        .single()

    const points = (current as any)?.points || 1
    const isExceeded = points > limit

    return {
        success: !isExceeded,
        remaining: Math.max(0, limit - points)
    }
}

