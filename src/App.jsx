import React, { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import DropZone from './components/Home/DropZone';
import Editor from './components/Editor/Editor';
import PageDialog from './components/Editor/PageDialog';
import { usePDFStore } from './store/pdfStore';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// ===== MODULE-LEVEL PERSISTENT BACKUP for PDF bytes =====
// This survives ALL React state changes, re-renders, and Zustand resets.
// It is the LAST RESORT fallback for "No PDF loaded" errors.
let _persistentPdfBytesBackup = null;
function _setPersistentBytes(bytes) {
  _persistentPdfBytesBackup = bytes;
  console.log('📦 PDF bytes persisted to module-level backup, length:', bytes?.length || 0);
}
function _getPersistentBytes() {
  const bytes = _persistentPdfBytesBackup;
  console.log('📦 Module-level backup check:', bytes ? `found (${bytes.length} bytes)` : 'null');
  return bytes;
}

// Helper: retrieve PDF bytes from all available sources (tries multiple tiers)
function _resolvePdfBytes(pdfBytesRef, fileBytesRef) {
  const store = usePDFStore.getState();
  const sources = [
    { name: 'pdfBytesRef', value: pdfBytesRef?.current },
    { name: 'store.pdfBytes', value: store.pdfBytes },
    { name: 'fileBytesRef', value: fileBytesRef?.current },
    { name: 'module-level backup', value: _getPersistentBytes() },
  ];
  let found = null;
  for (const src of sources) {
    if (src.value && src.value.length > 0) {
      console.log('📦 Using PDF bytes from:', src.name, `(${src.value.length} bytes)`);
      found = src.value;
      break;
    }
  }
  if (!found) {
    console.warn('📦 PDF bytes NOT FOUND in ANY source:', sources.map(s => s.name + '=' + (s.value ? (s.value.length + 'b') : 'null')).join(', '));
  }
  return found;
}

// Helper: store PDF bytes in ALL known sources
function _storePdfBytesAll(pdfBytesRef, fileBytesRef, bytes) {
  const safeBytes = bytes ? new Uint8Array(bytes) : bytes;
  usePDFStore.getState().setPdfBytes(safeBytes);
  if (pdfBytesRef) pdfBytesRef.current = safeBytes;
  if (fileBytesRef) fileBytesRef.current = safeBytes;
  _setPersistentBytes(safeBytes);
  console.log('📦 PDF bytes stored to ALL sources, length:', safeBytes?.length || 0);
}

export default function App() {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfDocLib, setPdfDocLib] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogMin, setDialogMin] = useState(1);
  const [dialogMax, setDialogMax] = useState(1);
  
  const { resetStore, setPdfBytes } = usePDFStore();
  const pdfBytesRef = useRef(null);
  const fileBytesRef = useRef(null);
  
  // Helper: get PDF bytes from all sources (tiered fallback)
  const getPdfBytes = useCallback(() => {
    return _resolvePdfBytes(pdfBytesRef, fileBytesRef);
  }, []);
  
  // Helper: store PDF bytes in ALL sources
  const storePdfBytes = useCallback((bytes) => {
    _storePdfBytesAll(pdfBytesRef, fileBytesRef, bytes);
  }, []);

  const showDeletePageDialog = useCallback(() => {
    if (!pageCount || pageCount < 1) {
      alert('Please wait for PDF to load');
      return;
    }
    setDialogType('delete');
    setDialogTitle('Delete Page');
    setDialogMessage(`Enter the page number you want to delete (1 to ${pageCount}):`);
    setDialogMin(1);
    setDialogMax(pageCount);
    setDialogOpen(true);
  }, [pageCount]);

  const showAddPageDialog = useCallback(() => {
    if (!pageCount || pageCount < 0) {
      alert('Please wait for PDF to load');
      return;
    }
    setDialogType('add');
    setDialogTitle('Add New Page');
    setDialogMessage(`Enter the page number after which you want to add a new page (1 to ${pageCount + 1}):`);
    setDialogMin(1);
    setDialogMax(pageCount + 1);
    setDialogOpen(true);
  }, [pageCount]);

  const handleDialogConfirm = useCallback(async (pageNumber) => {
    const pdfBytes = getPdfBytes();
    
    if (!pdfBytes || pdfBytes.length === 0) {
      console.warn('⚠️ handleDialogConfirm: No PDF bytes available from any source');
      alert('No PDF loaded');
      setDialogOpen(false);
      return;
    }

    if (!pageNumber || pageNumber < 1) {
      alert('Invalid page number');
      setDialogOpen(false);
      return;
    }

    try {
      // ALWAYS create fresh Uint8Array copy for pdf-lib
      const freshBytes = new Uint8Array(pdfBytes);
      const pdfDoc = await PDFDocument.load(freshBytes);
      const totalPages = pdfDoc.getPageCount();
      
      if (dialogType === 'delete') {
        if (totalPages <= 1) {
          alert('Cannot delete the only page');
          setDialogOpen(false);
          return;
        }
        if (pageNumber > totalPages) {
          alert(`Invalid page number. PDF has only ${totalPages} pages.`);
          setDialogOpen(false);
          return;
        }
        const pageIndex = pageNumber - 1;
        pdfDoc.removePage(pageIndex);
        
        const newBytes = await pdfDoc.save();
        const safeBytes = new Uint8Array(newBytes);
        // Store safe bytes in ALL sources (refs, store, module-level backup)
        storePdfBytes(safeBytes);
        
        // Reload pdf.js with FRESH copy
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(safeBytes)
        });
        const pdfDocument = await loadingTask.promise;
        setPdfDoc(pdfDocument);
        setPageCount(pdfDocument.numPages);
        
        // Reload pdf-lib with FRESH copy
        const pdfLibDoc = await PDFDocument.load(
          new Uint8Array(safeBytes)
        );
        setPdfDocLib(pdfLibDoc);
        
        // Adjust annotations: remove deleted page's annotations, shift subsequent pages
        const storeState = usePDFStore.getState();
        const anns = storeState.annotations;
        const filtered = anns.filter(a => a.pageIndex !== pageIndex);
        const adjusted = filtered.map(a => ({
          ...a,
          pageIndex: a.pageIndex > pageIndex ? a.pageIndex - 1 : a.pageIndex
        }));
        usePDFStore.setState({ annotations: adjusted });
        
        const currentPageState = storeState.currentPage;
        if (currentPageState >= pdfDocument.numPages) {
          setCurrentPage(pdfDocument.numPages - 1);
        }
        usePDFStore.getState().setCurrentPage(Math.min(currentPageState, pdfDocument.numPages - 1));
        
        alert(`Page ${pageNumber} deleted successfully!`);
        
      } else if (dialogType === 'add') {
        const insertIndex = pageNumber;
        const insertPageIdx = Math.min(insertIndex, totalPages);
        pdfDoc.insertPage(insertPageIdx, [595, 842]);
        
        const newBytes = await pdfDoc.save();
        const safeBytes = new Uint8Array(newBytes);
        // Store safe bytes in ALL sources (refs, store, module-level backup)
        storePdfBytes(safeBytes);
        
        // Reload pdf.js with FRESH copy
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(safeBytes)
        });
        const pdfDocument = await loadingTask.promise;
        setPdfDoc(pdfDocument);
        setPageCount(pdfDocument.numPages);
        
        // Reload pdf-lib with FRESH copy
        const pdfLibDoc = await PDFDocument.load(
          new Uint8Array(safeBytes)
        );
        setPdfDocLib(pdfLibDoc);
        
        // Shift annotations on pages >= insertIndex by +1
        const storeState = usePDFStore.getState();
        const anns = storeState.annotations;
        const shifted = anns.map(a => ({
          ...a,
          pageIndex: a.pageIndex >= insertPageIdx ? a.pageIndex + 1 : a.pageIndex
        }));
        usePDFStore.setState({ annotations: shifted });
        
        setCurrentPage(insertPageIdx);
        usePDFStore.getState().setCurrentPage(insertPageIdx);
        
        alert(`New page added after page ${pageNumber} successfully!`);
      }
      
      setDialogOpen(false);
    } catch (err) {
      console.error(`${dialogType === 'delete' ? 'Delete' : 'Add'} page error:`, err);
      alert(`Failed to ${dialogType === 'delete' ? 'delete' : 'add'} page: ` + err.message);
      setDialogOpen(false);
    }
  }, [dialogType, getPdfBytes, storePdfBytes]);

  const handleDialogCancel = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleFileSelect = useCallback(async (file) => {
    if (isLoading) return;
    
    setCurrentFile(file);
    setIsLoading(true);
    setError(null);
    setCurrentPage(0);
    resetStore();
    usePDFStore.getState().setCurrentPage(0);
    
    try {
      console.log('📁 Loading PDF:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      // Store bytes in ALL sources (refs, store, module-level backup)
      storePdfBytes(pdfBytes);
      console.log('📁 PDF bytes stored, length:', pdfBytes.length);
      
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdfDocument = await loadingTask.promise;
      
      if (!pdfDocument || pdfDocument.numPages === 0) {
        throw new Error('Invalid PDF');
      }
      
      setPdfDoc(pdfDocument);
      setPageCount(pdfDocument.numPages);
      setCurrentPage(0);
      usePDFStore.getState().setCurrentPage(0);

      const pdfLibDoc = await PDFDocument.load(pdfBytes);
      setPdfDocLib(pdfLibDoc);	      // Don't auto-add detected annotations — let the user explicitly click "Detect Text"
	      // to avoid duplicate/overlapping annotation overlays.
	      console.log('🔍 Quick scan: PDF loaded (' + pdfDocument.numPages + ' pages). Click "Detect Text" to find text.');
      
    } catch (err) {
      console.error('❌ Failed to load PDF:', err);
      setError('Failed to load PDF: ' + (err.message || 'Invalid file format'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, resetStore]);

  const handleDownload = useCallback(async () => {
    const pdfBytes = getPdfBytes();
    
    if (!pdfBytes || pdfBytes.length === 0) {
      console.warn('⚠️ handleDownload: No PDF bytes available from any source');
      alert('No PDF loaded');
      return;
    }
    
    const store = usePDFStore.getState();

    try {
      const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBytes));
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;
      const allAnnotations = store.annotations;

      const fontCache = new Map();
      const mapFontName = (fontFamily, isBold, isItalic) => {
        const f = (fontFamily || 'arial').toLowerCase();
        let base = 'Helvetica';
        if (f.includes('times') || f.includes('serif')) base = 'TimesRoman';
        else if (f.includes('courier') || f.includes('mono')) base = 'Courier';
        else if (f.includes('verdana') || f.includes('georgia')) base = 'TimesRoman';
        
        const variants = [];
        if (isBold) variants.push('Bold');
        if (isItalic) variants.push('Italic');
        
        return base + variants.join('');
      };

      const hexToRgb = (hex) => {
        try {
          if (!hex || typeof hex !== 'string') return { r: 0, g: 0, b: 0 };
          const cleanHex = hex.replace('#', '');
          if (cleanHex.length < 6) return { r: 0, g: 0, b: 0 };
          return {
            r: parseInt(cleanHex.slice(0, 2), 16) / 255,
            g: parseInt(cleanHex.slice(2, 4), 16) / 255,
            b: parseInt(cleanHex.slice(4, 6), 16) / 255
          };
        } catch {
          return { r: 0, g: 0, b: 0 };
        }
      };

      const sanitizeText = (text) => {
        if (!text) return '';
        return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ').trim();
      };

      const standardFonts = {
        'Helvetica': StandardFonts.Helvetica,
        'HelveticaBold': StandardFonts.HelveticaBold,
        'HelveticaItalic': StandardFonts.HelveticaItalic,
        'HelveticaBoldItalic': StandardFonts.HelveticaBoldItalic,
        'TimesRoman': StandardFonts.TimesRoman,
        'TimesRomanBold': StandardFonts.TimesRomanBold,
        'TimesRomanItalic': StandardFonts.TimesRomanItalic,
        'TimesRomanBoldItalic': StandardFonts.TimesRomanBoldItalic,
        'Courier': StandardFonts.Courier,
        'CourierBold': StandardFonts.CourierBold,
        'CourierItalic': StandardFonts.CourierItalic,
        'CourierBoldItalic': StandardFonts.CourierBoldItalic,
      };

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      fontCache.set('Helvetica', helveticaFont);
      let addedCount = 0;
      let editedCount = 0;

      for (const ann of allAnnotations) {
        if (!ann.text || !ann.text.trim()) continue;
        if (ann.pageIndex < 0 || ann.pageIndex >= totalPages) continue;

        const page = pages[ann.pageIndex];
        if (!page) continue;

        const pageHeight = page.getHeight();
        const fontSize = ann.fontSize || 14;
        const sanitizedText = sanitizeText(ann.text);
        if (!sanitizedText) continue;

        const mappedFontName = mapFontName(ann.fontFamily, ann.isBold, ann.isItalic);
        let embeddedFont = fontCache.get(mappedFontName);

        if (!embeddedFont) {
          const stdFont = standardFonts[mappedFontName] || StandardFonts.Helvetica;
          embeddedFont = await pdfDoc.embedFont(stdFont);
          fontCache.set(mappedFontName, embeddedFont);
        }

        const color = hexToRgb(ann.textColor);

        // For detected/edited text: draw white rectangle to cover original, then draw new text
        if (ann.type !== 'text' && ann.originalText && ann.text !== ann.originalText) {
          // Draw white rectangle to cover original text
          const padding = 4;
          page.drawRectangle({
            x: (ann.x || 0) - padding,
            y: pageHeight - (ann.y || 0) - (ann.height || fontSize) - padding,
            width: (ann.width || (sanitizedText.length * fontSize * 0.6)) + padding * 2,
            height: (ann.height || fontSize) + padding * 2,
            color: rgb(1, 1, 1),
            borderWidth: 0,
          });
          editedCount++;
        }

        // Draw the text (both new and edited)
        if (ann.type === 'text' || (ann.type !== 'text' && ann.originalText && ann.text !== ann.originalText)) {
          page.drawText(sanitizedText, {
            x: ann.x || 50,
            y: pageHeight - (ann.y || 50) - fontSize,
            size: fontSize,
            font: embeddedFont,
            color: rgb(color.r, color.g, color.b),
          });
          addedCount++;
        }
      }

      if (addedCount === 0) {
        console.log('💾 No user-added text to embed. Saving original PDF.');
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      let msg = `PDF saved successfully!`;
      if (addedCount > 0) msg += `\n- ${addedCount} text(s) added/updated`;
      if (editedCount > 0) msg += `\n- ${editedCount} detected text(s) edited`;
      alert(msg);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download PDF: ' + err.message);
    }
  }, []);

  const handleReset = useCallback(() => {
    setPdfDoc(null);
    setPdfDocLib(null);
    setPageCount(0);
    setCurrentPage(0);
    setCurrentFile(null);
    setPdfBytes(null);
    setError(null);
    resetStore();
  }, [resetStore]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
      {!pdfDoc ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '32px' }}>
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
              📄 PDF Editor
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px' }}>
              Upload a PDF, add text, move it around, and save.
            </p>
            {error && (
              <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}
            <DropZone onFileSelect={handleFileSelect} isLoading={isLoading} />
          </div>
        </div>
      ) : (
        <>
          <Editor 
            pdfDocument={pdfDoc} 
            onDownload={handleDownload}
            onReset={handleReset}
            onDeletePage={showDeletePageDialog}
            onAddPage={showAddPageDialog}
          />

          <PageDialog
            isOpen={dialogOpen}
            title={dialogTitle}
            message={dialogMessage}
            minValue={dialogMin}
            maxValue={dialogMax}
            onConfirm={handleDialogConfirm}
            onCancel={handleDialogCancel}
          />
        </>
      )}
    </div>
  );
}
