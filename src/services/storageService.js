const DB_NAME = 'pdf-editor-db'
const DB_VERSION = 1
const STORE_NAME = 'pdfs'
const RECENT_FILES_STORE = 'recent'

let db = null

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const pdfStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        pdfStore.createIndex('lastModified', 'lastModified')
      }

      if (!database.objectStoreNames.contains(RECENT_FILES_STORE)) {
        const recentStore = database.createObjectStore(RECENT_FILES_STORE, { keyPath: 'id', autoIncrement: true })
        recentStore.createIndex('lastModified', 'lastModified')
      }
    }
  })
}

export const savePDF = async (pdf) => {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.put({
      id: pdf.id || crypto.randomUUID(),
      name: pdf.name,
      data: pdf.data,
      pages: pdf.pages,
      annotations: pdf.annotations || [],
      drawings: pdf.drawings || [],
      createdAt: pdf.createdAt || new Date(),
      lastModified: new Date()
    })

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getPDF = async (id) => {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getAllPDFs = async () => {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export const deletePDF = async (id) => {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const clearAllPDFs = async () => {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const addRecentFile = async (file) => {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([RECENT_FILES_STORE], 'readwrite')
    const store = transaction.objectStore(RECENT_FILES_STORE)

    const request = store.add({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(),
      thumbnail: file.thumbnail
    })

    request.onsuccess = () => {
      trimRecentFiles()
      resolve(request.result)
    }
    request.onerror = () => reject(request.error)
  })
}

export const getRecentFiles = async () => {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([RECENT_FILES_STORE], 'readonly')
    const store = transaction.objectStore(RECENT_FILES_STORE)
    const index = store.index('lastModified')
    const request = index.openCursor(null, 'prev')

    const files = []
    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        files.push(cursor.value)
        cursor.continue()
      } else {
        resolve(files.slice(0, 10))
      }
    }
    request.onerror = () => reject(request.error)
  })
}

const trimRecentFiles = async () => {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([RECENT_FILES_STORE], 'readwrite')
    const store = transaction.objectStore(RECENT_FILES_STORE)
    const request = store.openCursor(null, 'prev')

    const files = []
    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        files.push(cursor)
        cursor.continue()
      } else {
        if (files.length > 10) {
          const toDelete = files.slice(10)
          toDelete.forEach(f => f.delete())
        }
        resolve()
      }
    }
  })
}

export const estimateStorageUsage = async () => {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate()
    return { usage, quota, percentUsed: ((usage / quota) * 100).toFixed(2) }
  }
  return null
}