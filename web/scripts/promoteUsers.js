const { createClient } = require('@supabase/supabase-js')
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

async function promoteUsers() {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const usersToPromote = [
        { email: 'admin@test.com', role: 'admin' },
        { email: 'poc@test.com', role: 'campus_poc' }
    ]

    for (const item of usersToPromote) {
        // Get ID from auth
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
        const targetUser = authData.users.find(u => u.email === item.email)

        if (targetUser) {
            console.log(`Promoting ${item.email} to ${item.role}...`)
            const { error } = await supabase
                .from('users')
                .update({ role: item.role })
                .eq('id', targetUser.id)

            if (error) {
                console.error(`Failed to promote ${item.email}:`, error)
            } else {
                console.log(`Successfully promoted ${item.email}`)
            }
        } else {
            console.warn(`User ${item.email} not found in Auth`)
        }
    }
}

promoteUsers()
