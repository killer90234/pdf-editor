import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import DropZone from './components/Home/DropZone';
import Editor from './components/Editor/Editor';
import PageDialog from './components/Editor/PageDialog';
import { usePDFStore } from './store/pdfStore';
import { useAuthStore } from './store/authStore';
import LoginModal from './components/Auth/LoginModal';
import SignupModal from './components/Auth/SignupModal';
import UserProfile from './components/Auth/UserProfile';
import PricingPage from './components/Pricing/PricingPage';

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
  const { user, profile, initAuth, loading: authLoading, checkAndIncrementEdit, setShowLoginModal, showLoginModal, showSignupModal, showPricingModal, setShowPricingModal } = useAuthStore();
  const pdfBytesRef = useRef(null);
  const fileBytesRef = useRef(null);

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, [initAuth]);
  
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

    // === PLAN LIMIT CHECK ===
    const currentUser = useAuthStore.getState().user;
    const currentProfile = useAuthStore.getState().profile;

    if (currentUser) {
      // Signed-in user: check limits from Firestore profile
      if (!currentProfile) {
        setError('Please wait, loading your profile...');
        return;
      }
      const { canEdit } = await import('./services/firestoreService');
      const result = canEdit(currentProfile);
      console.log('🔍 Plan check:', { plan: currentProfile.plan, editsUsed: currentProfile.editsUsed, result });
      if (!result.allowed) {
        console.log('❌ Edit limit reached!');
        setError(`You've used all ${result.plan.maxEdits} edits on the ${result.plan.label} plan. Please upgrade to continue.`);
        useAuthStore.getState().setShowPricingModal(true);
        return;
      }
    } else {
      // Guest: allow 1 free edit, then require sign-in
      const guestEdits = parseInt(localStorage.getItem('guestEdits') || '0');
      if (guestEdits >= 1) {
        setError('Free edit used. Please sign in to continue.');
        setShowLoginModal(true);
        return;
      }
    }

    // === VALIDATE FILE ===
    if (file.size < 100) {
      setError('This file is too small to be a valid PDF. Please select a real PDF file.');
      return;
    }

    // === LOAD PDF ===
    setCurrentFile(file);
    setIsLoading(true);
    setError(null);
    setCurrentPage(0);
    resetStore();
    usePDFStore.getState().setCurrentPage(0);

    try {
      console.log('📁 Loading PDF:', file.name, 'Size:', file.size, 'bytes');

      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      // Validate PDF header (safe for large files - no spread operator)
      const headerBytes = pdfBytes.slice(0, 5);
      const headerStr = new TextDecoder().decode(headerBytes);
      console.log('📄 File header bytes:', Array.from(headerBytes), 'String:', headerStr);
      if (headerStr !== '%PDF-') {
        throw new Error('This file is not a valid PDF. Expected "%PDF-" header, got: "' + headerStr + '"');
      }

      storePdfBytes(pdfBytes);

      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdfDocument = await loadingTask.promise;

      if (!pdfDocument || pdfDocument.numPages === 0) {
        throw new Error('Invalid PDF');
      }

      setPdfDoc(pdfDocument);
      setPageCount(pdfDocument.numPages);
      setCurrentPage(0);
      usePDFStore.getState().setCurrentPage(0);
      console.log('✅ PDF loaded successfully via pdf.js:', pdfDocument.numPages, 'pages');

      // pdf-lib load (optional - large files may fail here)
      try {
        const pdfLibDoc = await PDFDocument.load(pdfBytes);
        setPdfDocLib(pdfLibDoc);
        console.log('✅ pdf-lib loaded OK');
      } catch (libErr) {
        console.warn('⚠️ pdf-lib failed (large file?), pdf.js will still work:', libErr.message);
        // pdf.js can still render — pdf-lib is only needed for save
      }

      // === CHARGE EDIT (only after successful load) ===
      if (currentUser) {
        const incResult = await checkAndIncrementEdit();
        console.log('✅ Edit charged:', incResult);
      } else {
        const guestEdits = parseInt(localStorage.getItem('guestEdits') || '0');
        localStorage.setItem('guestEdits', String(guestEdits + 1));
        console.log('✅ Guest edit charged:', guestEdits + 1);
      }

    } catch (err) {
      console.error('❌ Failed to load PDF:', err);
      setError(err.message || 'Failed to load PDF');
      setCurrentFile(null);
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

      const containsNonLatin = (text) => {
        if (!text) return false;
        // Check if text contains characters outside basic Latin + Latin Extended
        for (let i = 0; i < text.length; i++) {
          const code = text.charCodeAt(i);
          if (code > 0x024F) return true; // Beyond Latin Extended-B
        }
        return false;
      };

      const mapFontName = (fontFamily, isBold, isItalic) => {
        const f = (fontFamily || 'arial').toLowerCase();
        let base = 'Helvetica';
        // Check specific font names before generic "serif" to avoid matching "sans-serif"
        if (f.includes('times') || f.includes('georgia') || f.includes('cambria') || (f.includes('serif') && !f.includes('sans-serif'))) {
          base = 'TimesRoman';
        } else if (f.includes('courier') || f.includes('mono')) {
          base = 'Courier';
        }

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
        // Only remove control characters (C0 range except tab/newline/carriage return)
        // Preserve ALL printable Unicode including Gujarati, Hindi, Devanagari, etc.
        return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
      };

      // Map PDF font name to a CSS-compatible font family for display
      const mapPDFNameToCSS = (pdfFontName) => {
        if (!pdfFontName) return null;
        const name = pdfFontName.toLowerCase();
        // Strip font subset prefix (e.g., "ABCDEE+Calibri" -> "Calibri")
        const cleanName = name.replace(/^[a-z]{6}\+/, '');

        // Devanagari / Hindi
        if (cleanName.includes('devanagari') || cleanName === 'mangal' || cleanName === 'aparajita') {
          return 'Noto Sans Devanagari, Mangal, Aparajita, sans-serif';
        }
        // Gujarati
        if (cleanName.includes('gujarati') || cleanName === 'shruti') {
          return 'Noto Sans Gujarati, Shruti, sans-serif';
        }
        // Tamil
        if (cleanName.includes('tamil') || cleanName === 'latha' || cleanName === 'vijaya') {
          return 'Noto Sans Tamil, Latha, sans-serif';
        }
        // Bengali
        if (cleanName.includes('bengali') || cleanName === 'shonar' || cleanName === 'vrinda') {
          return 'Noto Sans Bengali, Vrinda, sans-serif';
        }
        // Telugu
        if (cleanName.includes('telugu') || cleanName === 'gautami') {
          return 'Noto Sans Telugu, Gautami, sans-serif';
        }
        // Kannada
        if (cleanName.includes('kannada') || cleanName === 'tunga') {
          return 'Noto Sans Kannada, Tunga, sans-serif';
        }
        // Malayalam
        if (cleanName.includes('malayalam') || cleanName === 'kartika') {
          return 'Noto Sans Malayalam, Kartika, sans-serif';
        }
        // Arabic / Urdu
        if (cleanName.includes('arabic') || cleanName === 'traditional arabic' || cleanName === 'simplified arabic') {
          return 'Noto Sans Arabic, Traditional Arabic, sans-serif';
        }
        // Common Latin fonts
        if (cleanName.includes('arial') || cleanName.includes('helvetica')) return 'Arial, Helvetica, sans-serif';
        if (cleanName.includes('times')) return '"Times New Roman", Times, serif';
        if (cleanName.includes('courier') || cleanName.includes('consolas')) return '"Courier New", Courier, monospace';
        if (cleanName.includes('calibri')) return 'Calibri, Arial, sans-serif';
        if (cleanName.includes('cambria')) return 'Cambria, Georgia, serif';
        if (cleanName.includes('georgia')) return 'Georgia, serif';
        if (cleanName.includes('verdana')) return 'Verdana, sans-serif';
        if (cleanName.includes('tahoma')) return 'Tahoma, sans-serif';
        if (cleanName.includes('segoe')) return '"Segoe UI", sans-serif';
        if (cleanName.includes('roboto')) return 'Roboto, sans-serif';
        if (cleanName.includes('noto sans')) return 'Noto Sans, sans-serif';
        if (cleanName.includes('noto serif')) return 'Noto Serif, serif';

        return null; // no match
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

      // Script detection: determine which Unicode script the text uses
      const detectScript = (text) => {
        if (!text) return null;
        for (let i = 0; i < text.length; i++) {
          const code = text.charCodeAt(i);
          if (code >= 0x0900 && code <= 0x097F) return 'devanagari';
          if (code >= 0x0A80 && code <= 0x0AFF) return 'gujarati';
          if (code >= 0x0B80 && code <= 0x0BFF) return 'tamil';
          if (code >= 0x0980 && code <= 0x09FF) return 'bengali';
          if (code >= 0x0C00 && code <= 0x0C7F) return 'telugu';
          if (code >= 0x0C80 && code <= 0x0CFF) return 'kannada';
          if (code >= 0x0D00 && code <= 0x0D7F) return 'malayalam';
          if (code >= 0x0600 && code <= 0x06FF) return 'arabic';
        }
        return null;
      };

      // Script-specific font URLs (Noto Sans fonts from Google Fonts CDN)
      const SCRIPT_FONT_URLS = {
        devanagari: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansDevanagari/hinted/ttf/NotoSansDevanagari-Regular.ttf',
        gujarati: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansGujarati/hinted/ttf/NotoSansGujarati-Regular.ttf',
        tamil: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansTamil/hinted/ttf/NotoSansTamil-Regular.ttf',
        bengali: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansBengali/hinted/ttf/NotoSansBengali-Regular.ttf',
        telugu: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansTelugu/hinted/ttf/NotoSansTelugu-Regular.ttf',
        kannada: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansKannada/hinted/ttf/NotoSansKannada-Regular.ttf',
        malayalam: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansMalayalam/hinted/ttf/NotoSansMalayalam-Regular.ttf',
        arabic: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansArabic/hinted/ttf/NotoSansArabic-Regular.ttf',
      };

      // Cache for script-specific Unicode fonts
      const unicodeFontCache = new Map();

      // Helper: get or embed a font that supports the text
      const getFontForText = async (ann, text) => {
        // If text contains non-Latin characters, we need a script-specific font
        if (containsNonLatin(text)) {
          const script = detectScript(text);
          if (script && unicodeFontCache.has(script)) {
            return unicodeFontCache.get(script);
          }
          if (script && SCRIPT_FONT_URLS[script]) {
            try {
              const response = await fetch(SCRIPT_FONT_URLS[script]);
              if (response.ok) {
                const fontBytes = await response.arrayBuffer();
                const scriptFont = await pdfDoc.embedFont(new Uint8Array(fontBytes), { subset: true });
                unicodeFontCache.set(script, scriptFont);
                return scriptFont;
              }
            } catch (e) {
              console.warn(`Could not load ${script} font, falling back:`, e.message);
            }
          }
          // Fallback: use Helvetica (characters may not render correctly)
          return helveticaFont;
        }

        // For Latin text, use standard mapped font
        const mappedFontName = mapFontName(ann.fontFamily, ann.isBold, ann.isItalic);
        let embeddedFont = fontCache.get(mappedFontName);

        if (!embeddedFont) {
          const stdFont = standardFonts[mappedFontName] || StandardFonts.Helvetica;
          embeddedFont = await pdfDoc.embedFont(stdFont);
          fontCache.set(mappedFontName, embeddedFont);
        }
        return embeddedFont;
      };

      for (const ann of allAnnotations) {
        if (!ann.text || !ann.text.trim()) continue;
        if (ann.pageIndex < 0 || ann.pageIndex >= totalPages) continue;

        const page = pages[ann.pageIndex];
        if (!page) continue;

        const pageHeight = page.getHeight();
        const fontSize = ann.fontSize || 14;
        const sanitizedText = sanitizeText(ann.text);
        if (!sanitizedText) continue;

        const embeddedFont = await getFontForText(ann, sanitizedText);
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

  // Compute edit limit info for display
  const editLimitInfo = (() => {
    if (!user) {
      const guestEdits = parseInt(localStorage.getItem('guestEdits') || '0');
      return { used: guestEdits, max: 1, label: 'Guest', isLimit: guestEdits >= 1 };
    }
    if (!profile) return null;
    const planKey = profile.plan || 'free';
    const limits = { free: 3, basic: 10, premium: 25, max: 50 };
    const max = limits[planKey] || 3;
    const used = profile.editsUsed ?? 0;
    const period = planKey === 'free' ? 'lifetime' : 'today';
    return { used, max, label: planKey, period, isLimit: used >= max };
  })();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
      {/* Auth header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 20px', background: 'white', borderBottom: '1px solid #e5e7eb',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
          PDF Forge
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Edit counter badge */}
          {editLimitInfo && (
            <div
              onClick={() => setShowPricingModal(true)}
              style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                background: editLimitInfo.isLimit ? '#fee2e2' : '#dbeafe',
                color: editLimitInfo.isLimit ? '#dc2626' : '#2563eb',
                cursor: 'pointer',
              }}
              title="Click to view plans"
            >
              {editLimitInfo.used}/{editLimitInfo.max === Infinity ? '∞' : editLimitInfo.max} edits
              {editLimitInfo.period && <span style={{ fontWeight: 400, marginLeft: 4 }}>({editLimitInfo.period})</span>}
            </div>
          )}
          {user ? (
            <UserProfile />
          ) : (
            <>
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  padding: '7px 16px', border: '1px solid #d1d5db', borderRadius: '6px',
                  background: 'white', color: '#374151', fontSize: '14px', fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => useAuthStore.getState().setShowSignupModal(true)}
                style={{
                  padding: '7px 16px', border: 'none', borderRadius: '6px',
                  background: '#3b82f6', color: 'white', fontSize: '14px', fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      {!pdfDoc ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '32px' }}>
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
              PDF Forge
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

      {/* Footer */}
      <div style={{
        padding: '10px 20px', background: 'white', borderTop: '1px solid #e5e7eb',
        textAlign: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          Powered by{' '}
          <a
            href="https://inforium-alliance.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '600' }}
          >
            Inforium Alliance
          </a>
        </span>
      </div>

      {/* Auth Modals */}
      <LoginModal />
      <SignupModal />
      {showPricingModal && <PricingPage onClose={() => setShowPricingModal(false)} />}
    </div>
  );
}
