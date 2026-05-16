import React from 'react'

const features = [
  {
    title: 'Edit Text',
    description: 'Add, modify, and delete text directly on PDF pages',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  },
  {
    title: 'Draw & Annotate',
    description: 'Freehand drawing, shapes, and highlight text',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    )
  },
  {
    title: 'Merge & Split',
    description: 'Combine multiple PDFs or split into separate documents',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
        <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    )
  },
  {
    title: 'Compress',
    description: 'Reduce PDF file size while maintaining quality',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
        <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }
]

const FeatureGrid = () => {
  return (
    <div style={{ marginTop: '64px' }}>
      <h2 style={{ fontSize: '30px', fontWeight: 'bold', textAlign: 'center', color: '#111827', marginBottom: '32px' }}>
        Powerful Features, Right in Your Browser
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '24px',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {features.map((feature, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              {feature.icon}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              {feature.title}
            </h3>
            <p style={{ color: '#4b5563', fontSize: '14px' }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeatureGrid