import React, { useState } from 'react'
import { usePDFStore } from '../../store/pdfStore'

const CompressPanel = () => {
  const [compressionLevel, setCompressionLevel] = useState('medium')
  const [isCompressing, setIsCompressing] = useState(false)
  const { pdfDoc, currentFile } = usePDFStore()

  const handleCompress = async () => {
    if (!pdfDoc) return

    setIsCompressing(true)
    try {
      pdfDoc.setModificationDate(new Date())

      const bytes = await pdfDoc.save({ useObjectStreams: compressionLevel === 'high' })
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const originalSize = currentFile?.size || 0
      const compressedSize = blob.size
      const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)

      const link = document.createElement('a')
      link.href = url
      link.download = currentFile?.name.replace('.pdf', '_compressed.pdf') || 'compressed.pdf'
      link.click()

      URL.revokeObjectURL(url)

      alert(`Compressed! Size reduced by ${savings}%`)
    } catch (error) {
      console.error('Error compressing PDF:', error)
      alert('Failed to compress PDF')
    } finally {
      setIsCompressing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compression Level
        </label>
        <div className="space-y-2">
          {[
            { id: 'low', label: 'Low', desc: 'Minimal compression, best quality' },
            { id: 'medium', label: 'Medium', desc: 'Balanced compression' },
            { id: 'high', label: 'High', desc: 'Maximum compression, may reduce quality' }
          ].map((level) => (
            <label
              key={level.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                compressionLevel === level.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="compressionLevel"
                value={level.id}
                checked={compressionLevel === level.id}
                onChange={(e) => setCompressionLevel(e.target.value)}
                className="sr-only"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{level.label}</p>
                <p className="text-sm text-gray-500">{level.desc}</p>
              </div>
              {compressionLevel === level.id && (
                <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </label>
          ))}
        </div>
      </div>
      <button
        onClick={handleCompress}
        disabled={isCompressing}
        className="w-full btn btn-primary"
      >
        {isCompressing ? 'Compressing...' : 'Compress PDF'}
      </button>
    </div>
  )
}

export default CompressPanel