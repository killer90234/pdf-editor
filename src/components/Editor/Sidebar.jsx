import React, { useEffect, useState } from 'react'
import { usePDFStore } from '../../store/pdfStore'

const Sidebar = ({ pageCount, currentPage, onPageChange, pdfDoc }) => {
  const { tool } = usePDFStore()
  const [thumbnails, setThumbnails] = useState({})
  const [isLoading, setIsLoading] = useState({})

  useEffect(() => {
    if (!pdfDoc) return

    const renderThumbnail = async (pageNum) => {
      if (thumbnails[pageNum] || isLoading[pageNum]) return
      
      setIsLoading(prev => ({ ...prev, [pageNum]: true }))

      try {
        const page = pdfDoc.getPage(pageNum - 1)
        const viewport = page.getViewport({ scale: 0.2 })
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({ canvasContext: ctx, viewport }).promise

        setThumbnails(prev => ({ ...prev, [pageNum]: canvas.toDataURL() }))
      } catch (err) {
        console.error('Error rendering thumbnail:', err)
      } finally {
        setIsLoading(prev => ({ ...prev, [pageNum]: false }))
      }
    }

    for (let i = 1; i <= Math.min(pageCount, 30); i++) {
      if (!thumbnails[i] && !isLoading[i]) {
        renderThumbnail(i)
      }
    }
  }, [pdfDoc, pageCount])

  if (!pdfDoc) {
    return (
      <div style={{ width: '256px', background: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>No PDF loaded</p>
      </div>
    )
  }

  return (
    <div style={{ width: '256px', background: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        <h3 style={{ fontWeight: 500, color: '#111827', fontSize: '14px' }}>Pages ({pageCount})</h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {Array.from({ length: pageCount }, (_, i) => {
          const pageNum = i + 1
          const isActive = currentPage === pageNum
          
          return (
            <div
              key={i}
              onClick={() => onPageChange(pageNum)}
              style={{
                cursor: 'pointer',
                border: isActive ? '2px solid #0ea5e9' : '2px solid #e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '8px',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 0 0 2px rgba(14, 165, 233, 0.2)' : 'none'
              }}
            >
              {thumbnails[pageNum] ? (
                <img src={thumbnails[pageNum]} alt={`Page ${pageNum}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '3/4', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Loading...</span>
                </div>
              )}
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', padding: '4px', background: 'white' }}>
                {pageNum}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Sidebar