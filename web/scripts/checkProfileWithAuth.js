import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
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

const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const url = env.NEXT_PUBLIC_SUPABASE_URL
if (!anon || !url) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, anon)

const email = process.argv[2]
const password = process.argv[3]
if (!email || !password) {
  console.error('Usage: node checkProfileWithAuth.js <email> <password>')
  process.exit(1)
}

console.log('Signing in', email)
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
console.log('signInError', signInError)
console.log('signInData', signInData)

if (!signInData?.session?.access_token) {
  process.exit(1)
}

const accessToken = signInData.session.access_token

// Query profile via REST using access token
const userId = 'c81d36d8-be9a-4a7c-9178-57c455abc58a'
const resById = await fetch(`${url}/rest/v1/users?id=eq.${userId}`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    apikey: anon,
    Accept: 'application/json',
  },
})
const jsonById = await resById.json()
console.log('rest by id status', resById.status)
console.log('rest by id body', jsonById)

const resAll = await fetch(`${url}/rest/v1/users`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    apikey: anon,
    Accept: 'application/json',
  },
})
const jsonAll = await resAll.json()
console.log('rest all status', resAll.status)
console.log('rest all body (first 5)', Array.isArray(jsonAll) ? jsonAll.slice(0, 5) : jsonAll)
