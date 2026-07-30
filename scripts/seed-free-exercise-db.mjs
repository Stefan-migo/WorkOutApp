#!/usr/bin/env node

/**
 * Seed free-exercise-db (~800 exercises) into local Supabase.
 *
 * UUID v5 determinista a partir del string ID de cada ejercicio
 * para mantener estabilidad entre corridas.
 *
 * Uso: node scripts/seed-free-exercise-db.mjs
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// UUID v5 — SHA-1(namespace + name), set version 5 + variant bits
// ---------------------------------------------------------------------------
const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

function uuidv5(name) {
  const ns = Buffer.from(DNS_NAMESPACE.replace(/-/g, ''), 'hex')
  const nameBuf = Buffer.from(name, 'utf-8')
  const hash = crypto.createHash('sha1').update(Buffer.concat([ns, nameBuf])).digest()
  hash[6] = (hash[6] & 0x0f) | 0x50
  hash[8] = (hash[8] & 0x3f) | 0x80
  const hex = hash.subarray(0, 16).toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const FREE_EXERCISE_DB_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'

const FREE_EXERCISE_DB_IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

const CATEGORY_MAP = {
  strength: 'strength',
  cardio: 'cardio',
  stretching: 'stretching',
  plyometrics: 'plyometrics',
  strongman: 'strongman',
  powerlifting: 'powerlifting',
}

const LEVEL_MAP = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  expert: 'advanced',
}

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = resolve(root, '.env.local')
  const content = readFileSync(envPath, 'utf-8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
  }
  return env
}

// ---------------------------------------------------------------------------
// Field mapper (snake_case para Supabase)
// ---------------------------------------------------------------------------
function mapExercise(raw) {
  return {
    id: uuidv5(raw.id),
    user_id: null,
    name: raw.name,
    description: null,
    category: CATEGORY_MAP[raw.category] ?? 'other',
    primary_muscles: raw.primaryMuscles ?? [],
    secondary_muscles: raw.secondaryMuscles ?? [],
    equipment: raw.equipment
      ? raw.equipment.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    instructions: raw.instructions ?? [],
    force: raw.force ?? null,
    mechanic: raw.mechanic ?? null,
    difficulty: LEVEL_MAP[raw.level] ?? 'beginner',
    images: raw.images
      ? raw.images.map((img) => `${FREE_EXERCISE_DB_IMAGE_BASE}${img}`)
      : [],
    source: 'free-exercise-db',
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const env = loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  // 1. Fetch
  console.log('⬇️  Fetching free-exercise-db...')
  const res = await fetch(FREE_EXERCISE_DB_URL)
  if (!res.ok) {
    console.error(`❌ Fetch failed: ${res.status} ${res.statusText}`)
    process.exit(1)
  }
  const rawExercises = await res.json()
  console.log(`   ${rawExercises.length} exercises fetched`)

  // 2. Map
  const mapped = rawExercises.map(mapExercise)

  // 3. Insert
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const BATCH_SIZE = 100
  let inserted = 0
  let errors = 0

  console.log('📦  Inserting...')
  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    const batch = mapped.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('exercises')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true })

    if (error) {
      console.error(`   Batch ${i / BATCH_SIZE + 1}: ${error.message}`)
      errors++
    } else {
      inserted += batch.length
      console.log(`   Batch ${i / BATCH_SIZE + 1}: ${batch.length} upserted`)
    }
  }

  console.log(`\n✅  Done. ${inserted}/${mapped.length} inserted, ${errors} error batches`)
}

main().catch((err) => {
  console.error('❌', err)
  process.exit(1)
})
