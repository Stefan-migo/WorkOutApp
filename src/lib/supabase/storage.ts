import { createClient } from './client'

const BUCKET = 'exercise-images'
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadImage(exerciseId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}`)
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB`)
  }

  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${exerciseId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return publicUrl
}

export async function deleteImage(path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}

export async function listImages(exerciseId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from(BUCKET).list(exerciseId)
  if (error) return []
  return data.map(f => {
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(`${exerciseId}/${f.name}`)
    return publicUrl
  })
}
