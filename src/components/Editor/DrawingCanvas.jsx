import React, { useRef, useState, useCallback, useEffect } from 'react'
import { usePDFStore } from '../../store/pdfStore'

const DrawingCanvas = ({ pageIndex, drawings, width, height, zoom }) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState([])
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)

  const { addDrawing, updateDrawing, deleteDrawing } = usePDFStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawings.forEach(drawing => {
      if (!drawing.points || drawing.points.length < 2) return

      ctx.beginPath()
      ctx.strokeStyle = drawing.color || '#000000'
      ctx.lineWidth = (drawing.strokeWidth || 2) * zoom
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const scaledPoints = drawing.points.map(p => ({
        x: p.x * zoom,
        y: p.y * zoom
      }))

      ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y)
      for (let i = 1; i < scaledPoints.length; i++) {
        ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y)
      }
      ctx.stroke()

      if (drawing.closePath) {
        ctx.closePath()
        ctx.stroke()
      }
    })
  }, [drawings, zoom])

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDrawing(true)

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    setCurrentPath([{ x, y }])
  }

  const handleMouseMove = (e) => {
    if (!isDrawing) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    setCurrentPath(prev => [...prev, { x, y }])

    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth * zoom
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (currentPath.length > 0) {
      const scaledCurrent = currentPath.map(p => ({ x: p.x * zoom, y: p.y * zoom }))
      const lastPoint = scaledCurrent[scaledCurrent.length - 1]
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(x * zoom, y * zoom)
      ctx.stroke()
    }
  }

  const handleMouseUp = (e) => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (currentPath.length > 1) {
      const newDrawing = {
        pageIndex,
        points: currentPath,
        color: strokeColor,
        strokeWidth,
        closePath: e.shiftKey
      }
      addDrawing(newDrawing)
    }

    setCurrentPath([])
  }

  if (!width || !height) return null

  return (
    <div className="absolute inset-0 pointer-events-auto">
      <canvas
        ref={canvasRef}
        width={width * zoom}
        height={height * zoom}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute bottom-2 left-2 flex items-center space-x-2 bg-white rounded shadow p-2 pointer-events-auto">
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
          title="Stroke color"
        />
        <input
          type="range"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          className="w-20"
          title="Stroke width"
        />
        <span className="text-xs text-gray-500">{strokeWidth}px</span>
      </div>
    </div>
  )
}

export default DrawingCanvas