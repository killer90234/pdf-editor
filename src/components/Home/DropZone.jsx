import React, { useState, useRef } from 'react'

const DropZone = ({ onFileSelect, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onFileSelect(files[0])
    } else {
      alert('Please select a PDF file')
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      if (files[0].type !== 'application/pdf' && !files[0].name.endsWith('.pdf')) {
        alert('Please select a PDF file')
        return
      }
      onFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragOver ? '#3b82f6' : '#d1d5db'}`,
        borderRadius: '12px',
        padding: '48px',
        textAlign: 'center',
        backgroundColor: isDragOver ? '#eff6ff' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.3s',
        maxWidth: '500px',
        margin: '0 auto'
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#4b5563' }}>Loading your PDF...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div>
            <p style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
              Drop your PDF here or click to upload
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Supports PDF files
            </p>
          </div>
          <button
            type="button"
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Choose PDF File
          </button>
        </div>
      )}
    </div>
  )
}

export default DropZone