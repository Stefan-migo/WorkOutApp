const DB_NAME = 'workoutapp-images'
const DB_VERSION = 2
export const EXERCISE_IMAGE_STORE = 'images'

export function openExerciseImageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(EXERCISE_IMAGE_STORE)) {
        const store = db.createObjectStore(EXERCISE_IMAGE_STORE, { keyPath: 'id' })
        store.createIndex('exerciseId', 'exerciseId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
