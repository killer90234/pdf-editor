import React from 'react'
import { PDF_TOOLS } from '../../store/pdfStore'

const Toolbar = ({ 
  activeTool, 
  onToolChange, 
  zoom, 
  onZoomChange, 
  canZoomOut, 
  canZoomIn,
  onDeleteAnnotation,
  onBack,
  onDownload,
  onDeletePage,
  onAddPage,
  onDetectText,
  currentPage,
  pageCount
}) => {
  const tools = [
    { id: 'back', label: 'Home', icon: '🏠' },
    { id: PDF_TOOLS.SELECT, label: 'Select', icon: '👆' },
    { id: PDF_TOOLS.TEXT, label: 'Text', icon: '🔤' },
    { id: PDF_TOOLS.DELETE, label: 'Delete', icon: '🗑️' },
    { id: 'download', label: 'Save PDF', icon: '💾' },
  ]

  const handleToolClick = (toolId) => {
    if (toolId === 'back') {
      onBack?.();
    } else if (toolId === 'download') {
      onDownload?.();
    } else {
      onToolChange(toolId);
    }
  }

  return (
    <div style={{ 
      background: 'white', 
      borderBottom: '1px solid #e5e7eb', 
      padding: '10px 16px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => handleToolClick(t.id)}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTool === t.id ? '#3b82f6' : '#f1f5f9',
              color: activeTool === t.id ? 'white' : '#334155',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={t.label}
          >
            <span style={{ fontSize: '16px' }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}

        <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 8px' }} />

        <button
          onClick={() => onDeletePage?.()}
          disabled={pageCount <= 1}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: pageCount <= 1 ? 'not-allowed' : 'pointer',
            border: 'none',
            background: '#fee2e2',
            color: pageCount <= 1 ? '#9ca3af' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: pageCount <= 1 ? 0.5 : 1
          }}
          title="Delete Page"
        >
          <span style={{ fontSize: '16px' }}>🗑️</span>
          <span>Delete Page</span>
        </button>

        <button
          onClick={() => onAddPage?.()}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Add Page"
        >
          <span style={{ fontSize: '16px' }}>➕</span>
          <span>Add Page</span>
        </button>

        <button
          onClick={() => onDetectText?.()}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Detect Text"
        >
          <span style={{ fontSize: '16px' }}>🔍</span>
          <span>Detect Text</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px' }}>
        <button
          onClick={() => onZoomChange(zoom - 0.25)}
          disabled={!canZoomOut}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            background: 'white',
            border: '1px solid #e2e8f0',
            cursor: canZoomOut ? 'pointer' : 'not-allowed',
            opacity: canZoomOut ? 1 : 0.4,
            fontSize: '18px',
            fontWeight: 'bold'
          }}
          title="Zoom Out"
        >
          −
        </button>
        <span style={{ fontSize: '14px', color: '#475569', minWidth: '50px', textAlign: 'center', fontWeight: 500 }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoomChange(zoom + 0.25)}
          disabled={!canZoomIn}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            background: 'white',
            border: '1px solid #e2e8f0',
            cursor: canZoomIn ? 'pointer' : 'not-allowed',
            opacity: canZoomIn ? 1 : 0.4,
            fontSize: '18px',
            fontWeight: 'bold'
          }}
          title="Zoom In"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default Toolbar