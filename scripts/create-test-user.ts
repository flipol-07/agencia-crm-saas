
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
    const email = 'antigravity_test@example.com'
    const password = 'Password123!'

    console.log(`Attempting to create user: ${email}`)

    // Check if user exists first to avoid error
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const userExists = existingUsers?.users.find(u => u.email === email)

    if (userExists) {
        console.log('User already exists. ID:', userExists.id)
        return
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Antigravity Test' }
    })

    if (error) {
        console.error('Error creating user:', error)
        process.exit(1)
    }

    console.log('User created successfully:', data.user.id)
}

createTestUser()
