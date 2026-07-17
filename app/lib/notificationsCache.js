// L2 cache for notifications — IndexedDB store keyed by alert id.
// Rows older than TTL_MS are dropped on read so the store self-prunes.
//
// v2 rekeys the secondary index from familyId to parentId: the Android schema
// has no family document, so alerts are scoped by the parent's uid. The store
// is disposable (it only mirrors Firestore), so the upgrade drops it wholesale
// rather than migrating rows — a cold read just repopulates from the listener.

const DB_NAME = 'guardiane-notifications'
const DB_VERSION = 2
const STORE = 'alerts'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE)
      }
      const store = db.createObjectStore(STORE, { keyPath: 'id' })
      store.createIndex('parentId', 'parentId', { unique: false })
      store.createIndex('cachedAt', 'cachedAt', { unique: false })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

/** Read all cached alerts for a parent, newest first, dropping expired rows. */
export async function readCachedAlerts(parentId) {
  if (!parentId) return []
  let db
  try {
    db = await openDb()
  } catch {
    return []
  }
  return new Promise((resolve) => {
    const store = tx(db, 'readonly')
    const idx = store.index('parentId')
    const req = idx.getAll(parentId)
    req.onsuccess = () => {
      const now = Date.now()
      const fresh = (req.result || [])
        .filter((row) => now - (row.cachedAt ?? 0) < TTL_MS)
        .sort((a, b) => (b.timestampMs ?? 0) - (a.timestampMs ?? 0))
      resolve(fresh)
    }
    req.onerror = () => resolve([])
  })
}

/** Upsert alerts. Each row needs id + parentId; we add cachedAt. */
export async function writeCachedAlerts(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return
  let db
  try {
    db = await openDb()
  } catch {
    return
  }
  const store = tx(db, 'readwrite')
  const now = Date.now()
  for (const row of rows) {
    if (!row?.id || !row?.parentId) continue
    store.put({ ...row, cachedAt: now })
  }
  return new Promise((resolve) => {
    store.transaction.oncomplete = () => resolve()
    store.transaction.onerror = () => resolve()
  })
}

/** Drop a single alert from cache (e.g. on dismiss). */
export async function deleteCachedAlert(id) {
  if (!id) return
  let db
  try {
    db = await openDb()
  } catch {
    return
  }
  const store = tx(db, 'readwrite')
  store.delete(id)
  return new Promise((resolve) => {
    store.transaction.oncomplete = () => resolve()
    store.transaction.onerror = () => resolve()
  })
}
