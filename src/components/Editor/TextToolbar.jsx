import React from 'react';
import { usePDFStore } from '../../store/pdfStore';

const AVAILABLE_FONTS = [
  // Latin fonts
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial', group: 'Latin' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica', group: 'Latin' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman', group: 'Latin' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New', group: 'Latin' },
  { value: 'Verdana, sans-serif', label: 'Verdana', group: 'Latin' },
  { value: 'Georgia, serif', label: 'Georgia', group: 'Latin' },
  { value: 'Calibri, Arial, sans-serif', label: 'Calibri', group: 'Latin' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma', group: 'Latin' },
  // Indic script fonts
  { value: 'Noto Sans Devanagari, Mangal, sans-serif', label: 'Devanagari (Hindi)', group: 'Indic' },
  { value: 'Noto Sans Gujarati, Shruti, sans-serif', label: 'Gujarati', group: 'Indic' },
  { value: 'Noto Sans Tamil, Latha, sans-serif', label: 'Tamil', group: 'Indic' },
  { value: 'Noto Sans Bengali, Vrinda, sans-serif', label: 'Bengali', group: 'Indic' },
  { value: 'Noto Sans Telugu, Gautami, sans-serif', label: 'Telugu', group: 'Indic' },
  { value: 'Noto Sans Kannada, Tunga, sans-serif', label: 'Kannada', group: 'Indic' },
  { value: 'Noto Sans Malayalam, Kartika, sans-serif', label: 'Malayalam', group: 'Indic' },
  // Other scripts
  { value: 'Noto Sans Arabic, Traditional Arabic, sans-serif', label: 'Arabic', group: 'Other' },
  { value: 'Noto Sans, sans-serif', label: 'Noto Sans (Universal)', group: 'Other' },
];

// Find the best matching font option for a given font family string
const findMatchingFont = (fontFamily) => {
  if (!fontFamily) return AVAILABLE_FONTS[0].value;

  const ff = fontFamily.toLowerCase();

  // Try exact match first
  for (const font of AVAILABLE_FONTS) {
    if (font.value.toLowerCase() === ff) return font.value;
  }

  // Try partial match by checking if the font family contains key words
  for (const font of AVAILABLE_FONTS) {
    const fontLower = font.label.toLowerCase();
    if (ff.includes(fontLower) || fontLower.includes(ff.split(',')[0].trim().toLowerCase())) {
      return font.value;
    }
  }

  // Check for script-specific keywords
  if (ff.includes('devanagari') || ff.includes('mangal') || ff.includes('hindi')) {
    return 'Noto Sans Devanagari, Mangal, sans-serif';
  }
  if (ff.includes('gujarati') || ff.includes('shruti')) {
    return 'Noto Sans Gujarati, Shruti, sans-serif';
  }
  if (ff.includes('tamil') || ff.includes('latha')) {
    return 'Noto Sans Tamil, Latha, sans-serif';
  }
  if (ff.includes('bengali') || ff.includes('vrinda')) {
    return 'Noto Sans Bengali, Vrinda, sans-serif';
  }
  if (ff.includes('arabic')) {
    return 'Noto Sans Arabic, Traditional Arabic, sans-serif';
  }

  // Default to Arial
  return AVAILABLE_FONTS[0].value;
};

const TextToolbar = ({ onClose, currentPage }) => {
  const { selectedAnnotation, setSelectedAnnotation, updateAnnotation, deleteAnnotation, addAnnotation } = usePDFStore();
  const [text, setText] = React.useState('');
  const [fontSize, setFontSize] = React.useState(16);
  const [fontFamily, setFontFamily] = React.useState('Arial, Helvetica, sans-serif');
  const [textColor, setTextColor] = React.useState('#000000');
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [textAlign, setTextAlign] = React.useState('left');

  // Editing = has a real annotation in the store (has an id from addAnnotation)
  const isEditing = selectedAnnotation && !!selectedAnnotation.id && (selectedAnnotation.type === 'text' || selectedAnnotation.type === 'detected' || selectedAnnotation.type === 'overlap' || selectedAnnotation.type === 'duplicate');

  React.useEffect(() => {
    if (isEditing && selectedAnnotation) {
      setText(selectedAnnotation.text || '');
      setFontSize(selectedAnnotation.fontSize || 16);
      // Find the best matching font for the annotation's fontFamily
      setFontFamily(findMatchingFont(selectedAnnotation.fontFamily));
      setTextColor(selectedAnnotation.textColor || '#000000');
      setIsBold(selectedAnnotation.isBold || false);
      setIsItalic(selectedAnnotation.isItalic || false);
      setIsUnderline(selectedAnnotation.isUnderline || false);
      setTextAlign(selectedAnnotation.textAlign || 'left');
    } else {
      setText('');
      setFontSize(16);
      setFontFamily('Arial, Helvetica, sans-serif');
      setTextColor('#000000');
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      setTextAlign('left');
    }
  }, [selectedAnnotation, isEditing]);

  const handleTextChange = (newText) => {
    setText(newText);
    if (isEditing && selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, { text: newText });
    }
  };

  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
    if (isEditing && selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, { fontSize: newSize });
    }
  };

  const handleFontFamilyChange = (newFamily) => {
    setFontFamily(newFamily);
    if (isEditing && selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, { fontFamily: newFamily });
    }
  };

  const handleTextColorChange = (newColor) => {
    setTextColor(newColor);
    if (isEditing && selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, { textColor: newColor });
    }
  };

  const handleBoldToggle = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    if (isEditing && selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, { isBold: newBold });
    }
  };

  const handleItalicToggle = () => {
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    if (isEditing && selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, { isItalic: newItalic });
    }
  };

  const handleUnderlineToggle = () => {
    const newUnderline = !isUnderline;
    setIsUnderline(newUnderline);
    if (isEditing && selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, { isUnderline: newUnderline });
    }
  };

  const handleAlignChange = (newAlign) => {
    setTextAlign(newAlign);
    if (isEditing && selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, { textAlign: newAlign });
    }
  };

  const handleDelete = () => {
    if (selectedAnnotation) {
      deleteAnnotation(selectedAnnotation.id);
      setSelectedAnnotation(null);
      onClose?.();
    }
  };

  const handleCancel = () => {
    setSelectedAnnotation(null);
    setText('');
    onClose?.();
  };

  const handleAddText = () => {
    if (!text.trim()) return;

    const annotation = {
      type: 'text',
      text: text,
      fontSize,
      fontFamily,
      textColor,
      isBold,
      isItalic,
      isUnderline,
      textAlign,
      pageIndex: currentPage,
      x: selectedAnnotation?.x || 100,
      y: selectedAnnotation?.y || 100
    };

    addAnnotation(annotation);
    setText('');
    setFontSize(16);
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setSelectedAnnotation(null);
  };

  return (
    <div style={{
      padding: '14px 20px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '16px',
      background: 'white',
      borderBottom: '2px solid #e2e8f0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
          {isEditing ? (selectedAnnotation?.type === 'detected' ? 'Edit Text:' : 'Edit Text:') : 'Add Text:'}
        </span>
        <input
          type="text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={isEditing ? 'Edit text...' : 'Type here...'}
          style={{
            padding: '10px 14px',
            border: '2px solid #cbd5e1',
            borderRadius: '8px',
            width: '200px',
            fontSize: '15px',
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: isUnderline ? 'underline' : 'none',
            outline: 'none'
          }}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isEditing) handleAddText();
            if (e.key === 'Escape') handleCancel();
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '13px', color: '#64748b' }}>Size:</label>
        <input
          type="number"
          min="8"
          max="72"
          value={fontSize}
          onChange={(e) => { const v = parseInt(e.target.value); if (v >= 8 && v <= 72) handleFontSizeChange(v); }}
          style={{
            padding: '8px',
            border: '2px solid #cbd5e1',
            borderRadius: '6px',
            width: '60px',
            textAlign: 'center',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '13px', color: '#64748b' }}>Font:</label>
        <select
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          style={{
            padding: '8px',
            border: '2px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '14px',
            maxWidth: '200px'
          }}
        >
          <optgroup label="Latin">
            {AVAILABLE_FONTS.filter(f => f.group === 'Latin').map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </optgroup>
          <optgroup label="Indic Scripts">
            {AVAILABLE_FONTS.filter(f => f.group === 'Indic').map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </optgroup>
          <optgroup label="Other Scripts">
            {AVAILABLE_FONTS.filter(f => f.group === 'Other').map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </optgroup>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '13px', color: '#64748b' }}>Color:</label>
        <input
          type="color"
          value={textColor}
          onChange={(e) => handleTextColorChange(e.target.value)}
          style={{ height: '34px', width: '44px', padding: '2px', border: '2px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
        <button
          onClick={handleBoldToggle}
          style={{
            width: '36px',
            height: '36px',
            fontWeight: 'bold',
            background: isBold ? '#3b82f6' : 'white',
            color: isBold ? 'white' : '#475569',
            border: '2px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          title="Bold (B)"
        >
          B
        </button>
        <button
          onClick={handleItalicToggle}
          style={{
            width: '36px',
            height: '36px',
            fontStyle: 'italic',
            background: isItalic ? '#3b82f6' : 'white',
            color: isItalic ? 'white' : '#475569',
            border: '2px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          title="Italic (I)"
        >
          I
        </button>
        <button
          onClick={handleUnderlineToggle}
          style={{
            width: '36px',
            height: '36px',
            textDecoration: 'underline',
            background: isUnderline ? '#3b82f6' : 'white',
            color: isUnderline ? 'white' : '#475569',
            border: '2px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          title="Underline (U)"
        >
          U
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { align: 'left', icon: '\u2190' },
          { align: 'center', icon: '\u2194' },
          { align: 'right', icon: '\u2192' }
        ].map(({ align, icon }) => (
          <button
            key={align}
            onClick={() => handleAlignChange(align)}
            style={{
              width: '36px',
              height: '36px',
              fontSize: '14px',
              background: textAlign === align ? '#3b82f6' : 'white',
              color: textAlign === align ? 'white' : '#475569',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {icon}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '3px solid #e2e8f0', paddingLeft: '14px', marginLeft: '4px' }}>
        {isEditing ? (
          <>
            <button
              onClick={handleDelete}
              style={{
                padding: '10px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Delete
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 16px',
                background: '#94a3b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          </>
        ) : (
          <button
            onClick={handleAddText}
            disabled={!text.trim()}
            style={{
              padding: '12px 24px',
              background: text.trim() ? '#3b82f6' : '#cbd5e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              fontWeight: '700',
              fontSize: '15px'
            }}
          >
            Add Text
          </button>
        )}
      </div>
    </div>
  );
};

export default TextToolbar;
