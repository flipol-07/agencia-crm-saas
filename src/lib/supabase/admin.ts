import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
        console.warn('[Supabase Admin] WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. RLS might block operations.')
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
