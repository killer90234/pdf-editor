# PDF Editor Feature Testing Guide

This document outlines how to test the core features of the PDF Editor Web Portal.

## Testing Environment Setup

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser to `http://localhost:5173`

## Feature Tests

### 1. File Management

**Upload PDF**
- Click drag & drop area or "Browse files" button
- Select a PDF file (<50MB)
- Verify file appears in PDF list
- Verify file name and size are displayed correctly

**Delete PDF**
- Click delete button (trash icon) on a PDF entry
- Confirm PDF is removed from list
- If it was the current PDF, verify viewer shows "No PDF selected" state

**Select PDF**
- Click on a PDF entry in the list
- Verify PDF loads in viewer
- Verify sidebar highlights selected PDF

### 2. PDF Viewer

**Page Navigation**
- Use "Previous" and "Next" buttons
- Verify page number updates correctly
- Test jumping to first/last page

**Jump to Page**
- Enter page number in input field
- Press Enter or click away
- Verify viewer jumps to specified page

**Zoom Controls**
- Click "Zoom In" button
- Verify zoom percentage increases
- Click "Zoom Out" button
- Verify zoom percentage decreases
- Test limits (min 50%, max 300%)

**Rotation**
- Click "Rotate Left" button
- Verify PDF rotates 90° counterclockwise
- Click "Rotate Right" button
- Verify PDF rotates 90° clockwise
- Test multiple rotations

### 3. Page Operations

**Merge PDFs**
- Select a PDF in the list
- Click "Merge PDF" button in toolbar
- Select another PDF file
- Verify merged PDF appears with new name
- Verify merged PDF contains pages from both originals

**Split PDF**
- Select a multi-page PDF
- Click "Split" in toolbar (or implement split UI)
- Specify start and end page numbers
- Verify split PDF is created with correct page range

### 4. Annotation Tools

**Text Annotation**
- Select "T" button in toolbar
- Enter text in the input field
- Click "Apply" button
- Verify text appears on PDF (default position)
- Test with different colors using color picker

**Image Annotation**
- Select "🖼️" button in toolbar
- Click to select image file (PNG/JPG)
- Click "Apply" button
- Verify image appears on PDF

**Shape Annotation**
- Select "▢" button in toolbar
- Choose shape type (rectangle/circle)
- Optionally check "Fill" box
- Select color using color picker
- Click "Apply" button
- Verify shape appears on PDF

### 5. Export Functionality

**Download PDF**
- Make any changes to a PDF (annotation, rotation, etc.)
- Click "Export PDF" button
- Verify browser downloads file
- Verify downloaded file contains modifications
- Verify file naming convention (edited-originalname.pdf)

## Performance Tests

**Large PDF Handling**
- Test with PDF >25MB
- Verify upload completes successfully
- Verify viewer loads without crashing
- Verify operations remain responsive

**Multiple PDFs**
- Upload 5+ PDFs
- Verify all appear in list
- Verify switching between PDFs works correctly
- Verify memory usage remains reasonable

## Error Handling Tests

**Invalid File Types**
- Try uploading non-PDF file (JPG, TXT, etc.)
- Verify error message appears
- Verify file is not added to list

**Oversized Files**
- Try uploading PDF >50MB
- Verify upload is rejected
- Verify appropriate error message

**Corrupted PDFs**
- Try uploading damaged/invalid PDF
- Verify error handling in viewer
- Verify user gets meaningful feedback

## Cross-Browser Testing

Test in these browsers:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Safari (latest)
- Microsoft Edge (latest)

Verify:
- UI renders correctly
- All features functional
- No JavaScript errors in console
- File operations work consistently

## Mobile Responsiveness

Test on mobile devices or using browser dev tools:
- Verify sidebar collapses/expands correctly
- Verify toolbar adapts to smaller screens
- Verify PDF viewer remains usable
- Verify touch controls work for file selection

## Test PDF Samples

For thorough testing, use these types of PDFs:
1. Simple text PDF (1-2 pages)
2. Multi-page document (10+ pages)
3. PDF with images
4. Scanned PDF (image-only pages)
5. PDF with existing annotations/form fields
6. Encrypted PDF (should fail gracefully)
7. Very large PDF (50MB+ if available)

## Automation Considerations

For future automated testing, consider:
- Unit tests for utility functions
- Integration tests for API endpoints
- End-to-end tests with Cypress or Playwright
- Visual regression testing for UI components
- Performance benchmarks for PDF operations