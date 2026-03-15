import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

console.log('getUserId.js starting')

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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const email = process.argv[2]
if (!email) {
  console.error('Usage: node getUserId.js <email>')
  process.exit(1)
}

const { data, error } = await supabase.auth.admin.listUsers({ query: email, limit: 10 })
console.log('error', error)
console.log('data', JSON.stringify(data, null, 2))
