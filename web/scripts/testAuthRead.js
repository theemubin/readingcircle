import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

function parseDotenv(filePath) {
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
  const vars = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    vars[key] = value
  }
  return vars
}

const envPath = path.resolve(process.cwd(), '.env.local')
const env = parseDotenv(envPath)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function main() {
  const email = 'student@test.com'
  const password = 'Test1234!'

  console.log('Signing in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  console.log('signInError', signInError)
  console.log('signInData user id', signInData?.user?.id)

  const accessToken = signInData?.session?.access_token
  if (!accessToken) {
    console.error('No access token')
    process.exit(1)
  }

  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })

  console.log('Querying profile row...')
  const { data: profile, error: profileError } = await client.from('users').select('*').eq('id', signInData.user.id).single()
  console.log('profileError', profileError)
  console.log('profile', profile)
}

main().catch(err => {
  console.error('unexpected', err)
})
