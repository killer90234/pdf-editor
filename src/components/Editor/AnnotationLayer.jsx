import React, { useRef, useCallback, useEffect, useState } from 'react';
import { usePDFStore } from '../../store/pdfStore';

const hexToRgb = (hex) => {
  if (!hex) return { r: 0, g: 0, b: 0 };
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const DRAG_THRESHOLD = 3;

const AnnotationLayer = ({
  pageIndex,
  annotations,
  zoom,
  tool,
  pageWidth,
  pageHeight,
  onAnnotationClick,
  onAnnotationDragStart,
  onStartEditing,
  editingAnnotationId,
  onTextEdit,
  onEditComplete
}) => {
  const store = usePDFStore();

  // Drag state refs for stable event handlers
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragAnnStart = useRef({ x: 0, y: 0 });
  const dragAnnId = useRef(null);
  const didMove = useRef(false);
  const currentZoom = useRef(zoom);
  currentZoom.current = zoom;

  // Stable refs for callbacks
  const onClickRef = useRef(onAnnotationClick);
  onClickRef.current = onAnnotationClick;
  const onDragStartRef = useRef(onAnnotationDragStart);
  onDragStartRef.current = onAnnotationDragStart;
  const onStartEditRef = useRef(onStartEditing);
  onStartEditRef.current = onStartEditing;

  // Document-level move handler
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging.current || !dragAnnId.current) return;
      e.preventDefault();

      const z = currentZoom.current;
      const dx = (e.clientX - dragStartPos.current.x) / z;
      const dy = (e.clientY - dragStartPos.current.y) / z;

      if (!didMove.current) {
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist > DRAG_THRESHOLD / z) {
          didMove.current = true;
        }
      }

      if (didMove.current) {
        const newX = Math.max(0, dragAnnStart.current.x + dx);
        const newY = Math.max(0, dragAnnStart.current.y + dy);
        store.moveAnnotation(dragAnnId.current, newX, newY);
      }
    };

    const handleUp = (e) => {
      if (!isDragging.current) return;

      const annId = dragAnnId.current;
      const wasDrag = didMove.current;

      isDragging.current = false;
      dragAnnId.current = null;
      didMove.current = false;

      if (!wasDrag && annId) {
        // It was a click, not a drag
        const ann = store.annotations.find(a => a.id === annId);
        if (ann && onClickRef.current) {
          onClickRef.current(ann, e);
        }
      }
    };

    document.addEventListener('pointermove', handleMove, { passive: false });
    document.addEventListener('pointerup', handleUp);

    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, []);

  // Start drag on pointer down
  const handlePointerDown = useCallback((ann, e) => {
    if (tool === 'delete') return;
    if (e.button !== 0) return;

    e.stopPropagation();
    e.preventDefault();

    isDragging.current = true;
    didMove.current = false;
    dragAnnId.current = ann.id;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragAnnStart.current = { x: ann.x, y: ann.y };

    if (onDragStartRef.current) {
      onDragStartRef.current(ann);
    }
  }, [tool]);

  // Double-click to edit
  const handleDoubleClick = useCallback((ann, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onStartEditRef.current) {
      onStartEditRef.current(ann);
    }
  }, []);

  // Click handler (stop propagation to canvas)
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  // Inline editor component
  const InlineEditor = ({ annotation }) => {
    const [text, setText] = useState(annotation.text || '');
    const inputRef = useRef(null);

    useEffect(() => {
      setText(annotation.text || '');
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    }, [annotation.id]);

    const fontSize = (annotation.fontSize || 12) * zoom;
    const isDetected = annotation.type !== 'text';

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onTextEdit(annotation.id, text);
        onEditComplete(annotation.id);
      } else if (e.key === 'Escape') {
        onEditComplete(annotation.id);
      }
    };

    const handleBlur = () => {
      onTextEdit(annotation.id, text);
      onEditComplete(annotation.id);
    };

    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: annotation.x * zoom,
          top: annotation.y * zoom,
          minWidth: Math.max((annotation.width || 100) * zoom, 100),
          fontSize: `${fontSize}px`,
          color: annotation.textColor || '#000000',
          fontFamily: annotation.fontFamily || 'Arial, sans-serif',
          fontWeight: annotation.isBold ? 'bold' : 'normal',
          fontStyle: annotation.isItalic ? 'italic' : 'normal',
          textDecoration: annotation.isUnderline ? 'underline' : 'none',
          background: isDetected ? 'rgba(255,255,255,0.98)' : 'rgba(200,220,255,0.95)',
          border: '2px solid #3b82f6',
          borderRadius: '3px',
          padding: '2px 6px',
          outline: 'none',
          zIndex: 100,
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
        }}
      />
    );
  };

  const renderAnnotation = (ann) => {
    const isSelected = store.selectedAnnotation?.id === ann.id;
    const isEditing = editingAnnotationId === ann.id;
    const isTextLike = ['text', 'detected', 'overlap', 'duplicate'].includes(ann.type);

    if (!isTextLike) return null;

    // Show inline editor when editing
    if (isEditing) {
      return <InlineEditor key={ann.id} annotation={ann} />;
    }

    const fontSize = (ann.fontSize || 12) * zoom;
    const color = ann.color || ann.textColor || '#000000';
    const { r, g, b } = hexToRgb(color);
    const isDetected = ann.type !== 'text';

    return (
      <div
        key={ann.id}
        style={{
          position: 'absolute',
          left: ann.x * zoom,
          top: ann.y * zoom,
          width: (ann.width || 0) * zoom || 'auto',
          height: (ann.height || 0) * zoom || 'auto',
          fontSize: `${fontSize}px`,
          color: `rgb(${r}, ${g}, ${b})`,
          fontFamily: ann.fontFamily || 'Arial, sans-serif',
          fontWeight: ann.isBold ? 'bold' : 'normal',
          fontStyle: ann.isItalic ? 'italic' : 'normal',
          textDecoration: ann.isUnderline ? 'underline' : 'none',
          textAlign: ann.textAlign || 'left',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          // White background for detected text to cover original PDF text
          backgroundColor: isDetected ? 'rgba(255,255,255,0.95)' : (isSelected ? 'rgba(200,220,255,0.3)' : 'transparent'),
          padding: '1px 3px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          cursor: 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          border: isSelected ? '2px solid #3b82f6' : (isDetected ? '1px dashed rgba(59,130,246,0.3)' : '1px solid transparent'),
          borderRadius: '2px',
          zIndex: isSelected ? 20 : 10
        }}
        title="Drag to move \u2022 Double-click to edit"
        onPointerDown={(e) => handlePointerDown(ann, e)}
        onClick={handleClick}
        onDoubleClick={(e) => handleDoubleClick(ann, e)}
      >
        {ann.text || ''}
      </div>
    );
  };

  if (!pageWidth || !pageHeight) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: pageWidth,
        height: pageHeight,
        pointerEvents: 'none'
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {annotations.map(ann => (
          <div key={ann.id} style={{ pointerEvents: 'auto' }}>
            {renderAnnotation(ann)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnotationLayer;
