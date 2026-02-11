'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { logSecurityEvent } from '@/lib/audit-logger'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 'unknown'

    // Rate Limit Check (5 attempts per minute)
    const { success } = await rateLimit(ip, 5)
    if (!success) {
        await logSecurityEvent(null, 'LOGIN_FAILED', 'auth', { ip, reason: 'rate_limit_exceeded' })
        return { error: 'Demasiados intentos. Por favor espera un minuto.' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    })

    if (error) {
        await logSecurityEvent(null, 'LOGIN_FAILED', 'auth', { ip, error: error.message })
        return { error: error.message }
    }

    if (data.user) {
        await logSecurityEvent(data.user.id, 'LOGIN_SUCCESS', 'auth', { ip })
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 'unknown'

    // Rate Limit Check for Signup (3 per minute)
    const { success } = await rateLimit(ip, 3)
    if (!success) {
        return { error: 'Too many signup attempts. Please try again later.' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/check-email')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await (supabase.from('profiles') as any)
        .update({
            full_name: formData.get('full_name') as string,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
