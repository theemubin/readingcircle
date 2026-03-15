const { createClient } = require('@supabase/supabase-js')

// Manual env parsing since dotenv is missing from paths
const fs = require('fs')
const path = require('path')

const envFile = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envFile, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=')
    if (key && rest.length > 0) {
        env[key.trim()] = rest.join('=').trim()
    }
})

async function checkUsers() {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing env vars', { url: !!supabaseUrl, key: !!supabaseServiceKey })
        return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: users, error } = await supabase
        .from('users')
        .select('id, role, display_name, username')

    if (error) {
        console.error('Error fetching users:', error)
        return
    }

    console.log('--- Public Users Table ---')
    console.table(users)

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
        console.error('Error fetching auth users:', authError)
        return
    }

    console.log('--- Auth Users Table ---')
    console.table(authData.users.map(u => ({ id: u.id, email: u.email })))
}

checkUsers()
