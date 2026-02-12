import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lqgdjvecnahcdmmkncjs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZ2RqdmVjbmFoY2RtbWtuY2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzQ5OTEsImV4cCI6MjA4NDQ1MDk5MX0.jkt1rPb170Uju009TwZz_6rV60ymZqSQlnMIzEwEN80'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
    console.log('Attempting to create test user...')
    const { data, error } = await supabase.auth.signUp({
        email: 'mobile_tester@aurie.com',
        password: 'password123',
        options: {
            data: {
                full_name: 'Mobile Tester',
            }
        }
    })

    if (error) {
        console.error('Error creating user:', error)
    } else {
        console.log('User created/logged in:', data.user?.email)
    }
}

createTestUser()
