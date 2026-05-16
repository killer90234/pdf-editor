import React, { useState, useEffect } from 'react';

const PageDialog = ({ isOpen, title, message, minValue, maxValue, onConfirm, onCancel }) => {
  const [pageNumber, setPageNumber] = useState(minValue);

  useEffect(() => {
    setPageNumber(minValue);
  }, [minValue, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (pageNumber >= minValue && pageNumber <= maxValue) {
      onConfirm(pageNumber);
    } else {
      alert(`Please enter a valid page number between ${minValue} and ${maxValue}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        minWidth: '320px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b', fontWeight: 600 }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b' }}>
          {message}
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#475569', marginBottom: '8px' }}>
            Page Number:
          </label>
          <input
            type="number"
            min={minValue}
            max={maxValue}
            value={pageNumber}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {
                setPageNumber(val);
              }
            }}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #cbd5e1',
              borderRadius: '8px',
              outline: 'none'
            }}
            autoFocus
          />
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
            Enter a number between {minValue} and {maxValue}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageDialog;