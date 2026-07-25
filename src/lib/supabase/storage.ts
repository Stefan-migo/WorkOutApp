import { createClient } from './client'

const BUCKET = 'exercise-images'

export async function uploadImage(exerciseId: string, file: File): Promise<string> {
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
