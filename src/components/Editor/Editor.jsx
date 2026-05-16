import React, { useCallback, useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePDFStore, PDF_TOOLS } from '../../store/pdfStore';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import TextToolbar from './TextToolbar';
import { extractAllText, convertToAnnotations } from '../../services/textDetection';
import AnnotationLayer from './AnnotationLayer';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function Editor({ pdfDocument, onDownload, onReset, onDeletePage, onAddPage }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const isMountedRef = useRef(false);
  const wrapperRef = useRef(null);

  const {
    currentPage, setCurrentPage, zoom, setZoom, tool, setTool,
    annotations, selectedAnnotation, setSelectedAnnotation, deleteAnnotation, updateAnnotation, moveAnnotation,
    markPageAsScanned, addAnnotation
  } = usePDFStore();

  const [pageData, setPageData] = useState(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (e) {}
        renderTaskRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current || !pdfDocument || !canvasRef.current) return;

    let cancelled = false;
    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch (e) {}
        }
        const page = await pdfDocument.getPage(currentPage + 1);
        const viewport = page.getViewport({ scale: zoom });
        setPageData({ width: viewport.width, height: viewport.height });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (cancelled) return;
        renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
        await renderTaskRef.current.promise;
      } catch (err) {
        if (!cancelled && err.name !== 'RenderingCancelledException') {
          console.error('Render error:', err);
        }
      }
    };
    renderPage();
    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (e) {}
      }
    };
  }, [pdfDocument, currentPage, zoom]);

  const handlePageChange = useCallback((pageNum) => {
    setCurrentPage(pageNum - 1);
    setSelectedAnnotation(null);
    setEditingAnnotationId(null);
  }, [setCurrentPage, setSelectedAnnotation]);

  const handleZoomChange = useCallback((newZoom) => {
    setZoom(Math.max(0.25, Math.min(3, newZoom)));
  }, [setZoom]);

  const handleToolChange = useCallback((selectedTool) => {
    setTool(selectedTool);
    setSelectedAnnotation(null);
    setEditingAnnotationId(null);
  }, [setTool, setSelectedAnnotation]);

  // Handle canvas click for adding new text - uses canvas coordinates directly
  const handleCanvasClick = useCallback((e) => {
    // Don't handle if click was on an annotation (stopped propagation)
    if (e.defaultPrevented) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Calculate position relative to canvas, accounting for zoom
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (tool === PDF_TOOLS.TEXT) {
      // Create new text annotation at exact click position
      const newAnnotation = {
        type: 'text',
        text: '',
        x: x,
        y: y,
        pageIndex: currentPage,
        fontSize: 14,
        fontFamily: 'Arial',
        textColor: '#000000',
        isBold: false,
        isItalic: false,
        isUnderline: false,
        textAlign: 'left',
        width: 0,
        height: 0
      };

      addAnnotation(newAnnotation);
      // Get the newly added annotation
      const store = usePDFStore.getState();
      const added = store.annotations[store.annotations.length - 1];
      if (added) {
        setSelectedAnnotation(added);
        setEditingAnnotationId(added.id);
      }
    } else if (tool === PDF_TOOLS.SELECT) {
      setSelectedAnnotation(null);
      setEditingAnnotationId(null);
    }
  }, [tool, currentPage, zoom, addAnnotation, setSelectedAnnotation]);

  // Handle clicking on an existing annotation
  const handleAnnotationClick = useCallback((ann, e) => {
    if (tool === PDF_TOOLS.DELETE) {
      deleteAnnotation(ann.id);
      setSelectedAnnotation(null);
      setEditingAnnotationId(null);
    } else {
      setSelectedAnnotation(ann);
    }
  }, [tool, deleteAnnotation, setSelectedAnnotation]);

  // Handle inline text edit
  const handleTextEdit = useCallback((id, newText) => {
    updateAnnotation(id, { text: newText });
  }, [updateAnnotation]);

  // Handle edit completion - clean up empty annotations
  const handleEditComplete = useCallback((id) => {
    const store = usePDFStore.getState();
    const ann = store.annotations.find(a => a.id === id);
    if (ann && (!ann.text || !ann.text.trim())) {
      deleteAnnotation(id);
    }
    setEditingAnnotationId(null);
  }, [deleteAnnotation]);

  // Start inline editing for an annotation
  const startInlineEditing = useCallback((ann) => {
    setSelectedAnnotation(ann);
    setEditingAnnotationId(ann.id);
  }, [setSelectedAnnotation]);

  // Handle drag start from annotation
  const handleAnnotationDragStart = useCallback((ann) => {
    setSelectedAnnotation(ann);
  }, [setSelectedAnnotation]);

  const handleDeleteText = useCallback((id) => {
    deleteAnnotation(id);
    setSelectedAnnotation(null);
    setEditingAnnotationId(null);
  }, [deleteAnnotation, setSelectedAnnotation]);

  const handleCloseToolbar = useCallback(() => {
    setSelectedAnnotation(null);
    setEditingAnnotationId(null);
  }, [setSelectedAnnotation]);

  const handleDetectText = useCallback(async () => {
    if (!pdfDocument) return;

    try {
      console.log('Starting text detection...');
      const extractedText = await extractAllText(pdfDocument);
      const newAnnotations = convertToAnnotations(extractedText);

      let added = 0;
      for (const ann of newAnnotations) {
        const exists = annotations.some(e => e.uniqueKey === ann.uniqueKey);
        if (!exists) {
          addAnnotation(ann);
          added++;
        }
      }

      for (let i = 0; i < pdfDocument.numPages; i++) {
        markPageAsScanned(i);
      }

      console.log(`Detection complete: ${added} new text items`);
      alert(`Text Detection Complete!\nFound ${added} editable text items.\nDouble-click on any text to edit it.`);
    } catch (err) {
      console.error('Text detection error:', err);
      alert('Failed to detect text: ' + err.message);
    }
  }, [pdfDocument, annotations, addAnnotation, markPageAsScanned]);

  const canZoomOut = zoom > 0.25;
  const canZoomIn = zoom < 3;
  const currentAnnotations = annotations.filter(ann => ann.pageIndex === currentPage);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#e2e8f0' }}>
      <Toolbar
        activeTool={tool}
        onToolChange={handleToolChange}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        canZoomOut={canZoomOut}
        canZoomIn={canZoomIn}
        onDeleteAnnotation={handleDeleteText}
        onBack={onReset}
        onDownload={onDownload}
        onDeletePage={onDeletePage}
        onAddPage={onAddPage}
        onDetectText={handleDetectText}
        currentPage={currentPage + 1}
        pageCount={pdfDocument.numPages}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          pageCount={pdfDocument.numPages}
          currentPage={currentPage + 1}
          onPageChange={handlePageChange}
          pdfDoc={pdfDocument}
        />

        <div style={{ flex: 1, overflow: 'auto', background: '#94a3b8', padding: '16px', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={wrapperRef}
            style={{
              position: 'relative',
              display: 'inline-block',
              cursor: tool === PDF_TOOLS.TEXT ? 'crosshair' : 'default'
            }}
          >
            {/* Canvas for PDF rendering */}
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{
                display: 'block',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                background: 'white'
              }}
            />

            {/* Annotation layer overlaid on canvas */}
            {pageData && (
              <AnnotationLayer
                pageIndex={currentPage}
                annotations={currentAnnotations}
                zoom={zoom}
                tool={tool}
                pageWidth={pageData.width}
                pageHeight={pageData.height}
                onAnnotationClick={handleAnnotationClick}
                onAnnotationDragStart={handleAnnotationDragStart}
                onStartEditing={startInlineEditing}
                editingAnnotationId={editingAnnotationId}
                onTextEdit={handleTextEdit}
                onEditComplete={handleEditComplete}
              />
            )}
          </div>
        </div>

        {/* Text toolbar at bottom - shows when annotation selected but not in inline edit mode */}
        {selectedAnnotation && !editingAnnotationId && (['text', 'detected', 'overlap', 'duplicate'].includes(selectedAnnotation.type)) && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: '240px',
            right: 0,
            background: 'white',
            borderTop: '3px solid #2563eb',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
            zIndex: 999
          }}>
            <TextToolbar
              currentPage={currentPage}
              onClose={handleCloseToolbar}
            />
          </div>
        )}
      </div>
    </div>
  );
}
