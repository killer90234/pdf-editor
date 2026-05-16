import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjs from 'pdfjs-dist'
import { usePDFStore, PDF_TOOLS } from '../../store/pdfStore'
import AnnotationLayer from './AnnotationLayer'
import DrawingCanvas from './DrawingCanvas'

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

const PDFViewer = ({ 
  pdfDoc, 
  pdfPages, 
  currentPage, 
  zoom, 
  tool, 
  onPageChange,
  selectedAnnotation
}) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [pageData, setPageData] = useState(null)
  const [isRendering, setIsRendering] = useState(false)
  const renderTaskRef = useRef(null)
  const scaleRef = useRef(zoom)

  const { 
    annotations, 
    drawings, 
    setCurrentPage,
    setSelectedAnnotation,
    deleteAnnotation
  } = usePDFStore()

  const handleAnnotationClick = (annotation, e) => {
    e.stopPropagation()

    if (tool === 'delete') {
      deleteAnnotation(annotation.id)
    } else if (annotation.type === 'text' && tool !== 'select') {
      setSelectedAnnotation(annotation)
    }
  };

  useEffect(() => {
    scaleRef.current = zoom
  }, [zoom])

  useEffect(() => {
    if (!pdfDoc) return

    const renderPage = async () => {
      if (!canvasRef.current || !pdfDoc) return

      setIsRendering(true)

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel()
        }

        const page = await pdfDoc.getPage(currentPage + 1)
        const viewport = page.getViewport({ scale: scaleRef.current })

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        renderTaskRef.current = page.render(renderContext)
        await renderTaskRef.current.promise

        setPageData({
          width: viewport.width,
          height: viewport.height,
          originalWidth: page.getWidth(),
          originalHeight: page.getHeight()
        })
      } catch (error) {
        if (error.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', error)
        }
      } finally {
        setIsRendering(false)
      }
    }

    renderPage()
  }, [pdfDoc, currentPage, zoom])

  // Removed handleCanvasClick as text positioning is now handled by Editor container
  // The Editor handles canvas clicks for text positioning and shows the TextToolbar

  const pageAnnotations = annotations.filter(ann => ann.pageIndex === currentPage)
  const pageDrawings = drawings.filter(draw => draw.pageIndex === currentPage)

  const showAnnotationLayer = [PDF_TOOLS.TEXT, PDF_TOOLS.HIGHLIGHT, PDF_TOOLS.SHAPE].includes(tool)
  const showDrawingCanvas = tool === PDF_TOOLS.DRAW

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center"
    >
      <div className="relative shadow-lg" style={{ transform: `scale(1)`, transformOrigin: 'top center' }}>
        <canvas
          ref={canvasRef}
          className="bg-white"
        />

        {showAnnotationLayer && (
          <AnnotationLayer
            pageIndex={currentPage}
            annotations={pageAnnotations}
            selectedAnnotation={selectedAnnotation}
            zoom={zoom}
            tool={tool}
            pageWidth={pageData?.width}
            pageHeight={pageData?.height}
            onAnnotationClick={handleAnnotationClick}
            onDeleteAnnotation={(id) => deleteAnnotation(id)}
          />
        )}

        {showDrawingCanvas && (
          <DrawingCanvas
            pageIndex={currentPage}
            drawings={pageDrawings}
            width={pageData?.width || 0}
            height={pageData?.height || 0}
            zoom={zoom}
          />
        )}
      </div>
    </div>
  )
}

export default PDFViewer