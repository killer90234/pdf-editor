import React, { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { usePDFStore } from '../../store/pdfStore'

const SplitPanel = ({ pageCount, currentPage }) => {
  const [startPage, setStartPage] = useState(currentPage + 1)
  const [endPage, setEndPage] = useState(currentPage + 1)
  const [isSplitting, setIsSplitting] = useState(false)
  const { pdfDoc } = usePDFStore()

  const handleSplit = async () => {
    if (!pdfDoc || startPage < 1 || endPage > pageCount || startPage > endPage) {
      alert('Invalid page range')
      return
    }

    setIsSplitting(true)
    try {
      const newPdf = await PDFDocument.create()
      const pages = await newPdf.copyPages(pdfDoc, Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage - 1 + i
      ))
      pages.forEach(page => newPdf.addPage(page))

      const bytes = await newPdf.save()
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `split_pages_${startPage}-${endPage}.pdf`
      link.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error splitting PDF:', error)
      alert('Failed to split PDF')
    } finally {
      setIsSplitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Page (1-{pageCount})
        </label>
        <input
          type="number"
          min="1"
          max={pageCount}
          value={startPage}
          onChange={(e) => setStartPage(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1)))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          End Page (1-{pageCount})
        </label>
        <input
          type="number"
          min="1"
          max={pageCount}
          value={endPage}
          onChange={(e) => setEndPage(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1)))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div className="text-sm text-gray-500">
        This will extract {endPage - startPage + 1} page(s)
      </div>
      <button
        onClick={handleSplit}
        disabled={isSplitting}
        className="w-full btn btn-primary"
      >
        {isSplitting ? 'Splitting...' : 'Extract Pages'}
      </button>
    </div>
  )
}

export default SplitPanel