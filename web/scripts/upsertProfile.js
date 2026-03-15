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

console.log('upsertProfile: env', {
  url: env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
  key: env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const id = process.argv[2]
if (!id) {
  console.error('Usage: node upsertProfile.js <user-id>')
  process.exit(1)
}

console.log('upsertProfile: upserting', id)

const { data, error } = await supabase
  .from('users')
  .upsert({ id, display_name: 'Debug User', username: 'debug-user', role: 'student' }, { onConflict: 'id' })

console.log('upsertProfile: error', error)
console.log('upsertProfile: data', data)
