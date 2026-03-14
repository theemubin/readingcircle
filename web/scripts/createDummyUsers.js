#!/usr/bin/env node

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
    if (value.startsWith("\"") && value.endsWith("\"")) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    vars[key] = value
  }
  return vars
}

const envPath = path.resolve(process.cwd(), '.env.local')
const env = parseDotenv(envPath)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const users = [
  {
    email: 'student@test.com',
    password: 'Test1234!',
    display_name: 'Student Tester',
    username: 'student1',
    role: 'student',
  },
  {
    email: 'poc@test.com',
    password: 'Test1234!',
    display_name: 'Campus PoC',
    username: 'poc1',
    role: 'campus_poc',
  },
  {
    email: 'admin@test.com',
    password: 'Test1234!',
    display_name: 'Admin User',
    username: 'admin1',
    role: 'admin',
  },
]

async function upsertUser(user) {
  console.log(`\n→ Processing ${user.email}`)

  // Try to find existing auth user
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    query: user.email,
    limit: 1,
  })
  if (listError) {
    console.error('Failed to list users:', listError.message)
    return
  }

  let userId
  if (list?.data?.length) {
    userId = list.data[0].id
    console.log('  existing auth user found:', userId)
  } else {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })
    if (createError) {
      console.error('  create user failed:', createError.message)
      return
    }
    userId = created.id
    console.log('  created auth user:', userId)
  }

  // Upsert profile row
  const { error: upsertError } = await supabase
    .from('users')
    .upsert(
      {
        id: userId,
        display_name: user.display_name,
        username: user.username,
        role: user.role,
      },
      { onConflict: 'id' }
    )

  if (upsertError) {
    console.error('  upsert profile failed:', upsertError.message)
    return
  }

  console.log('  profile updated ✅')
}

async function main() {
  for (const user of users) {
    await upsertUser(user)
  }
  console.log('\nDone.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
