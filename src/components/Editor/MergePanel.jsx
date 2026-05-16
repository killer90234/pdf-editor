import React, { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { usePDFStore } from '../../store/pdfStore'

const MergePanel = ({ pdfDoc: mainPdfDoc }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isMerging, setIsMerging] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const { pdfDoc, currentFile } = usePDFStore()

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf')
    setSelectedFiles(files)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
    setSelectedFiles(files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleMerge = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one PDF to merge')
      return
    }

    setIsMerging(true)
    try {
      const mergedPdf = await PDFDocument.create()

      if (pdfDoc) {
        const mainPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
        mainPages.forEach(page => mergedPdf.addPage(page))
      }

      for (const file of selectedFiles) {
        try {
          // Validate file before reading
          if (!file || !(file instanceof File)) {
            throw new Error('Invalid file object')
          }

          const arrayBuffer = await file.arrayBuffer()

          // Validate ArrayBuffer
          if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength === 0) {
            throw new Error('Invalid or empty file data')
          }

          // Additional check for detachment
          try {
            new Uint8Array(arrayBuffer)
          } catch (bufferError) {
            throw new Error('File data is corrupted or detached')
          }

          const pdf = await PDFDocument.load(arrayBuffer)
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
          pages.forEach(page => mergedPdf.addPage(page))
        } catch (fileError) {
          console.error('Error processing file:', fileError)
          alert('Failed to process one of the files. Please try again.')
          continue
        }
      }

      const mergedBytes = await mergedPdf.save()
      const blob = new Blob([mergedBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `merged_${currentFile?.name || 'document.pdf'}`
      link.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error merging PDFs:', error)
      alert('Failed to merge PDFs. Make sure all files are valid PDFs.')
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Drop PDFs to merge
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="merge-file-input"
          />
          <label htmlFor="merge-file-input" className="cursor-pointer">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600">
              Click or drop PDF files here
            </p>
          </label>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">
            Selected files ({selectedFiles.length}):
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate">{file.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <button
          onClick={() => setSelectedFiles([])}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Clear selection
        </button>
      )}

      <button
        onClick={handleMerge}
        disabled={isMerging || selectedFiles.length === 0}
        className="w-full btn btn-primary"
      >
        {isMerging ? 'Merging...' : 'Merge PDFs'}
      </button>
    </div>
  )
}

export default MergePanel