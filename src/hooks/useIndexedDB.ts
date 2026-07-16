'use client'

import { useCallback, useEffect, useRef } from 'react'

export interface ImageEntry {
  blobUrl: string
  blobId: string
}

export interface UseIndexedDBReturn {
  getImages(exerciseId: string): Promise<ImageEntry[]>
  saveImage(exerciseId: string, file: File): Promise<string>
  deleteImage(exerciseId: string, blobId: string): Promise<void>
  getUsage(): Promise<number>
}

const DB_NAME = 'workoutapp-images'
const DB_VERSION = 1
const STORE_NAME = 'images'
const MAX_BYTES_PER_EXERCISE = 10 * 1024 * 1024 // 10MB

// ponytail: fallback UUID when crypto.randomUUID is unavailable
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// ponytail: store blobs as ArrayBuffer because fake-indexeddb in jsdom
// doesn't preserve Blob instances through structured clone
async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

function bufferToBlob(buffer: ArrayBuffer, type: string): Blob {
  return new Blob([buffer], { type })
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('exerciseId', 'exerciseId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ponytail: 10MB per exercise — make configurable via settings if users hit it
export function useIndexedDB(): UseIndexedDBReturn {
  const dbRef = useRef<IDBDatabase | null>(null)
  const blobUrlsRef = useRef<Set<string>>(new Set())
  const blobMapRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url)
        } catch {
          /* noop */
        }
      })
      blobUrlsRef.current.clear()
      blobMapRef.current.clear()
      if (dbRef.current) {
        dbRef.current.close()
        dbRef.current = null
      }
    }
  }, [])

  async function ensureDB(): Promise<IDBDatabase | null> {
    if (dbRef.current) return dbRef.current
    try {
      dbRef.current = await openDB()
      return dbRef.current
    } catch {
      return null
    }
  }

  function trackBlobUrl(blobId: string, url: string) {
    blobUrlsRef.current.add(url)
    blobMapRef.current.set(blobId, url)
  }

  function revokeByBlobId(blobId: string) {
    const url = blobMapRef.current.get(blobId)
    if (url) {
      blobUrlsRef.current.delete(url)
      blobMapRef.current.delete(blobId)
      try {
        URL.revokeObjectURL(url)
      } catch {
        /* noop */
      }
    }
  }

  const getImages = useCallback(
    async (exerciseId: string): Promise<ImageEntry[]> => {
      const db = await ensureDB()
      if (!db) return []

      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)

        const allRecords = await new Promise<any[]>((resolve, reject) => {
          const result: any[] = []
          const req = store.openCursor()
          req.onsuccess = () => {
            const cursor = req.result
            if (cursor) {
              if (cursor.value.exerciseId === exerciseId) {
                result.push(cursor.value)
              }
              cursor.continue()
            } else {
              resolve(result)
            }
          }
          req.onerror = () => reject(req.error)
        })

        return allRecords.map((record) => {
          const blob = bufferToBlob(record.blobData, record.blobType)
          const blobUrl = URL.createObjectURL(blob)
          const blobId = (record.id as string).split('::')[1] ?? record.id
          trackBlobUrl(blobId, blobUrl)
          return { blobUrl, blobId }
        })
      } catch {
        return []
      }
    },
    [],
  )

  const saveImage = useCallback(
    async (exerciseId: string, file: File): Promise<string> => {
      const db = await ensureDB()
      if (!db) throw new Error('IndexedDB is not available')

      const blobId = generateId()
      const id = `${exerciseId}::${blobId}`

      // ponytail: separate read tx from write tx — IDB auto-closes after all requests settle
      // Read: check existing size for 10MB cap
      const readTx = db.transaction(STORE_NAME, 'readonly')
      const index = readTx.objectStore(STORE_NAME).index('exerciseId')
      const existingRecords = await new Promise<any[]>((resolve, reject) => {
        const req = index.getAll(exerciseId)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })

      const existingSize = existingRecords.reduce(
        (sum, r) => sum + ((r.size as number) ?? 0),
        0,
      )
      if (existingSize + file.size > MAX_BYTES_PER_EXERCISE) {
        throw new Error('Image storage cap of 10MB per exercise exceeded')
      }

      // Convert file to ArrayBuffer for IDB storage (avoids Blob serialization issues)
      const blobData = await fileToArrayBuffer(file)

      // Write: store the blob
      const writeTx = db.transaction(STORE_NAME, 'readwrite')
      const store = writeTx.objectStore(STORE_NAME)
      const record = {
        id,
        exerciseId,
        blobData,
        blobType: file.type,
        name: file.name,
        size: file.size,
        createdAt: Date.now(),
      }

      await new Promise<void>((resolve, reject) => {
        const req = store.put(record)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })

      await new Promise<void>((resolve, reject) => {
        writeTx.oncomplete = () => resolve()
        writeTx.onerror = () => reject(writeTx.error)
      })

      const blob = bufferToBlob(blobData, file.type)
      const blobUrl = URL.createObjectURL(blob)
      trackBlobUrl(blobId, blobUrl)
      return blobUrl
    },
    [],
  )

  const deleteImage = useCallback(
    async (exerciseId: string, blobId: string): Promise<void> => {
      const db = await ensureDB()
      if (!db) throw new Error('IndexedDB is not available')

      revokeByBlobId(blobId)

      const id = `${exerciseId}::${blobId}`
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)

      const txComplete = new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })

      await new Promise<void>((resolve, reject) => {
        const req = store.delete(id)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })

      await txComplete
    },
    [],
  )

  const getUsage = useCallback(async (): Promise<number> => {
    const db = await ensureDB()
    if (!db) return 0

    try {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const allRecords = await new Promise<any[]>((resolve, reject) => {
        const req = store.getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })

      return allRecords.reduce((sum, r) => sum + ((r.size as number) ?? 0), 0)
    } catch {
      return 0
    }
  }, [])

  return { getImages, saveImage, deleteImage, getUsage }
}
