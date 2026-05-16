import React, { useCallback, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { usePDFStore } from '../../store/pdfStore'

const ITEM_TYPE = 'PAGE'

const PageThumbnail = ({ pageIndex, isSelected, onClick, onDelete, onReorder }) => {
  const [isDragging, setIsDragging] = useState(false)
  const { pdfPages, setCurrentPage, pdfDoc } = usePDFStore()
  const canvasRef = React.useRef(null)

  const [{ isDragging: isDraggingState }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { pageIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [pageIndex])

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item) => {
      if (item.pageIndex !== pageIndex) {
        onReorder?.(item.pageIndex, pageIndex)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [pageIndex, onReorder])

  React.useEffect(() => {
    const renderThumbnail = async () => {
      if (!canvasRef.current || !pdfDoc) return

      try {
        const page = await pdfDoc.getPage(pageIndex + 1)
        const viewport = page.getViewport({ scale: 0.15 })

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: ctx,
          viewport
        }).promise
      } catch (error) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#9ca3af'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`Page ${pageIndex + 1}`, canvas.width / 2, canvas.height / 2)
      }
    }

    const timeoutId = setTimeout(renderThumbnail, 100)
    return () => clearTimeout(timeoutId)
  }, [pdfDoc, pageIndex])

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete?.(pageIndex)
  }

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`mb-3 cursor-move transition-all duration-200 group relative ${
        isSelected ? 'ring-2 ring-primary-500' : 'hover:ring-1 hover:ring-gray-300'
      } ${isDraggingState ? 'opacity-50' : ''} ${isOver ? 'ring-2 ring-green-500' : ''}`}
      onClick={() => onClick?.(pageIndex)}
    >
      <canvas
        ref={canvasRef}
        width={160}
        height={200}
        className="w-full h-auto object-contain rounded border border-gray-200 bg-white shadow-sm"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b">
        <p className="text-center text-white text-xs py-1">
          Page {pageIndex + 1}
        </p>
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
          title="Delete page"
        >
          &times;
        </button>
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1 bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
          {pageIndex + 1}
        </div>
      )}
    </div>
  )
}

export default PageThumbnail