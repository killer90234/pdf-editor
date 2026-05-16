import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Load PDF document
export const loadPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  const pageCount = pdfDoc.getPageCount()

  const pages = []
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i)
    pages.push({
      index: i,
      width: page.getWidth(),
      height: page.getHeight(),
      rotation: page.getRotation().angle
    })
  }

  return { doc: pdfDoc, pages }
}

// Export PDF
export const exportPDF = async (pdfDoc) => {
  return await pdfDoc.save()
}

// Add text to PDF
export const addTextToPDF = async (pdfDoc, pageIndex, text, x, y, fontSize = 12) => {
  const page = pdfDoc.getPage(pageIndex)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  })
}

// Add annotation to PDF
export const addAnnotationToPDF = async (pdfDoc, pageIndex, annotation) => {
  const page = pdfDoc.getPage(pageIndex)

  switch (annotation.type) {
    case 'highlight':
      // Highlight text (simplified - would need text measurement for exact positioning)
      page.drawRectangle({
        x: annotation.x,
        y: annotation.y,
        width: annotation.width || 100,
        height: annotation.height || 20,
        color: rgb(1, 0.92, 0.42), // Yellow highlight
        opacity: 0.5
      })
      break

    case 'rectangle':
      page.drawRectangle({
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: annotation.height,
        borderColor: rgb(1, 0, 0),
        borderWidth: 2
      })
      break

    case 'circle':
      page.drawCircle({
        x: annotation.x + annotation.width / 2,
        y: annotation.y + annotation.height / 2,
        size: Math.max(annotation.width, annotation.height) / 2,
        borderColor: rgb(0, 0, 1),
        borderWidth: 2
      })
      break
  }
}

// Add drawing to PDF
export const addDrawingToPDF = async (pdfDoc, pageIndex, drawing) => {
  const page = pdfDoc.getPage(pageIndex)

  if (drawing.points && drawing.points.length > 1) {
    page.drawPolygon(drawing.points, {
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
      closePath: drawing.closePath || false
    })
  }
}

// Merge PDFs
export const mergePDFs = async (pdfDocs) => {
  const mergedPdf = await PDFDocument.create()

  for (const pdfDoc of pdfDocs) {
    const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
    pages.forEach(page => mergedPdf.addPage(page))
  }

  return mergedPdf
}

// Split PDF
export const splitPDF = async (pdfDoc, startPage, endPage) => {
  const newPdf = await PDFDocument.create()
  const pages = await newPdf.copyPages(pdfDoc, Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i))
  pages.forEach(page => newPdf.addPage(page))
  return newPdf
}

// Rotate page
export const rotatePage = async (pdfDoc, pageIndex, rotationAngle) => {
  const page = pdfDoc.getPage(pageIndex)
  page.setRotation(page.getRotation().angle + rotationAngle)
}

// Delete page
export const deletePage = async (pdfDoc, pageIndex) => {
  pdfDoc.removePage(pageIndex)
}

// Compress PDF (simplified - actual compression would require more complex implementation)
export const compressPDF = async (pdfDoc) => {
  // This is a placeholder - real PDF compression would require:
  // 1. Image optimization
  // 2. Font subsetting
  // 3. Content stream optimization
  // 4. Metadata removal

  // For now, just remove metadata
  pdfDoc.setModificationDate(new Date())

  return pdfDoc
}

// Get page thumbnail
export const getPageThumbnail = async (pdfDoc, pageIndex, scale = 0.2) => {
  const page = pdfDoc.getPage(pageIndex)
  const pageWidth = page.getWidth()
  const pageHeight = page.getHeight()

  const { width, height } = page.getSize()

  // Create a temporary PDF for thumbnail
  const thumbnailPdf = await PDFDocument.create()
  const [copiedPage] = await thumbnailPdf.copyPages(pdfDoc, [pageIndex])
  thumbnailPdf.addPage(copiedPage)

  return {
    width: width * scale,
    height: height * scale,
    originalWidth: width,
    originalHeight: height
  }
}