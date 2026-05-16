import { create } from 'zustand';

export const PDF_TOOLS = {
  SELECT: 'select',
  TEXT: 'text',
  HIGHLIGHT: 'highlight',
  DRAW: 'draw',
  SHAPE: 'shape',
  SIGNATURE: 'signature',
  MERGE: 'merge',
  SPLIT: 'split',
  COMPRESS: 'compress',
  DELETE: 'delete'
};

export const usePDFStore = create((set, get) => ({
  currentFile: null,
  pdfDoc: null,
  pdfDocLib: null,
  pdfPages: [],
  currentPage: 0,
  zoom: 1.0,
  tool: PDF_TOOLS.SELECT,
  annotations: [],
  selectedAnnotation: null,
  drawings: [],
  recentFiles: [],
  extractedText: null,
  pdfBytes: null,
  scannedPages: new Set(),

  setCurrentFile: (file) => set({ currentFile: file, scannedPages: new Set() }),
  setPdfBytes: (bytes) => set({ pdfBytes: bytes }),
  setPDFDoc: (pdfDoc, pdfDocLib, pdfPages) => set({ pdfDoc, pdfDocLib, pdfPages, scannedPages: new Set() }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
  setTool: (tool) => set({ tool }),
  setExtractedText: (text) => set({ extractedText: text }),
  
  markPageAsScanned: (pageIndex) => set((state) => {
    const newScanned = new Set(state.scannedPages);
    newScanned.add(pageIndex);
    return { scannedPages: newScanned };
  }),
  
  addAnnotation: (annotation) => set((state) => {
    if (annotation.uniqueKey && state.annotations.some(a => a.uniqueKey === annotation.uniqueKey)) {
      return state;
    }
    const newAnn = {
      ...annotation,
      id: annotation.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
      pageIndex: annotation.pageIndex ?? state.currentPage
    };
    return { annotations: [...state.annotations, newAnn] };
  }),
  
  setSelectedAnnotation: (annotation) => set({ selectedAnnotation: annotation }),
  
  deleteAnnotation: (id) => set((state) => ({
    annotations: state.annotations.filter(ann => ann.id !== id),
    selectedAnnotation: state.selectedAnnotation?.id === id ? null : state.selectedAnnotation
  })),
  
  updateAnnotation: (id, updates) => set((state) => ({
    annotations: state.annotations.map(ann => 
      ann.id === id ? { ...ann, ...updates } : ann
    ),
    selectedAnnotation: state.selectedAnnotation?.id === id 
      ? { ...state.selectedAnnotation, ...updates } 
      : state.selectedAnnotation
  })),
  
  moveAnnotation: (id, x, y) => set((state) => ({
    annotations: state.annotations.map(ann => 
      ann.id === id ? { ...ann, x, y } : ann
    ),
    selectedAnnotation: state.selectedAnnotation?.id === id 
      ? { ...state.selectedAnnotation, x, y } 
      : state.selectedAnnotation
  })),
  
  addDrawing: (drawing) => set((state) => ({
    drawings: [...state.drawings, { ...drawing, id: Date.now().toString(), pageIndex: state.currentPage }]
  })),
  
  setDrawings: (drawings) => set({ drawings }),
  clearDrawings: () => set({ drawings: [] }),
  
  addRecentFile: (file) => set((state) => ({ 
    recentFiles: [file, ...state.recentFiles].slice(0, 10) 
  })),
  
  resetStore: () => set({
    currentFile: null,
    pdfDoc: null,
    pdfDocLib: null,
    pdfPages: [],
    currentPage: 0,
    zoom: 1.0,
    tool: PDF_TOOLS.SELECT,
    annotations: [],
    selectedAnnotation: null,
    drawings: [],
    extractedText: null,
    pdfBytes: null
  })
}));
