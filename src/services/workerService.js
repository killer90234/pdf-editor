import { PDF_WORKER_ACTIONS } from './pdfWorkerActions'

let worker = null
let messageId = 0
const pendingMessages = new Map()

const createWorker = () => {
  if (typeof Worker === 'undefined') {
    console.warn('Web Workers not supported')
    return null
  }

  return new Worker(
    new URL('../workers/pdfWorker.js', import.meta.url),
    { type: 'module' }
  )
}

export const initWorker = () => {
  if (worker) return worker

  worker = createWorker()

  if (worker) {
    worker.onmessage = (event) => {
      const { ready, success, result, error, id } = event.data

      if (ready) {
        console.log('PDF Worker initialized')
        return
      }

      const pending = pendingMessages.get(id)
      if (pending) {
        pendingMessages.delete(id)
        if (success) {
          pending.resolve(result)
        } else {
          pending.reject(new Error(error))
        }
      }
    }

    worker.onerror = (error) => {
      console.error('Worker error:', error)
    }
  }

  return worker
}

export const terminateWorker = () => {
  if (worker) {
    worker.terminate()
    worker = null
  }
  pendingMessages.clear()
}

const sendMessage = (action, payload = {}) => {
  return new Promise((resolve, reject) => {
    if (!worker) {
      reject(new Error('Worker not initialized'))
      return
    }

    const id = ++messageId
    pendingMessages.set(id, { resolve, reject })

    worker.postMessage({ action, payload, id })
  })
}

export const loadPDFInWorker = async (arrayBuffer) => {
  initWorker()
  return sendMessage(PDF_WORKER_ACTIONS.LOAD_PDF, { arrayBuffer })
}

export const renderPageInWorker = async (pageIndex, scale) => {
  initWorker()
  return sendMessage(PDF_WORKER_ACTIONS.RENDER_PAGE, { pageIndex, scale })
}

export const mergePDFsInWorker = async (pdfBuffers) => {
  initWorker()
  return sendMessage(PDF_WORKER_ACTIONS.MERGE_PDFS, { pdfBuffers })
}

export const splitPDFInWorker = async (startPage, endPage) => {
  initWorker()
  return sendMessage(PDF_WORKER_ACTIONS.SPLIT_PDF, { startPage, endPage })
}

export const compressPDFInWorker = async (level) => {
  initWorker()
  return sendMessage(PDF_WORKER_ACTIONS.COMPRESS_PDF, { level })
}

export const exportPDFInWorker = async (options) => {
  initWorker()
  return sendMessage(PDF_WORKER_ACTIONS.EXPORT_PDF, { options })
}

export const getPageCountInWorker = async () => {
  initWorker()
  return sendMessage(PDF_WORKER_ACTIONS.GET_PAGE_COUNT, {})
}