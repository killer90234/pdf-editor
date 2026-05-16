# PDF Editor Web Portal

A modern, high-performance, browser-based PDF editor for local-first usage.

## Tech Stack

- **Frontend**: React.js with Vite, Tailwind CSS
- **Backend**: Node.js + Express.js
- **PDF Processing**: pdf-lib / PDF.js (frontend), pdfkit / hummusJS (backend optional)
- **Storage**: Local file system OR IndexedDB (browser persistence)

## Features

### Core Features
- File Management: Upload (drag & drop + file picker), list, preview, delete/rename PDFs
- PDF Viewer: Render pages with PDF.js, zoom, page navigation, thumbnail sidebar
- Editing: Add text, edit existing text (overlay), add images, draw annotations (pen, highlight, underline), add shapes
- Page Operations: Add/delete pages, rearrange (drag & drop), rotate, merge, split PDFs
- Export & Download: Save edited PDF, download final PDF, export with compression

### Advanced Features
- Digital signature support (draw/upload)
- Undo/Redo functionality
- Autosave (local storage / IndexedDB)
- Dark mode UI
- Keyboard shortcuts
- Watermark addition/removal

## Project Structure

```
pdf-editor/
├── frontend/                 # React/Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   ├── styles/           # Tailwind CSS
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
├── backend/                  # Node.js/Express backend
│   ├── controllers/          # Request handlers
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── utils/                # Utility functions
│   ├── middleware/           # Custom middleware
│   ├── server.js
│   └── package.json
└── README.md
```

## Setup Guide

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

### Development

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser

### Building for Production

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Build the backend (if needed):
   ```bash
   cd backend
   npm run build
   ```
3. Serve the built frontend from the backend (see `backend/server.js` for production setup)

## Implementation Notes

### PDF Text Editing Limitations
Due to PDF format constraints, editing existing text directly is complex. Our approach:
- For text editing: We overlay new text boxes on top of existing text
- For true text modification: We use pdf-lib to recreate page content with updated text (more resource-intensive)
- Fallback: When precise text editing fails, we inform the user and suggest re-creating the text element

### Performance Optimizations
- Virtual scrolling for large PDF page lists
- Web Workers for heavy PDF processing (merge/split operations)
- Lazy loading of PDF thumbnails
- IndexedDB for storing large PDF blobs in browser
- File validation and size limits (configurable)

### Security
- File type validation (PDF only)
- File size limits (default 50MB)
- Input sanitization for text annotations
- No external API calls without user consent

## API Endpoints (Backend)

```
POST   /api/pdf/upload          - Upload PDF file
GET    /api/pdf/:id             - Get PDF metadata
DELETE /api/pdf/:id             - Delete PDF
POST   /api/pdf/:id/merge       - Merge with another PDF
POST   /api/pdf/:id/split       - Split PDF at page range
POST   /api/pdf/:id/rotate      - Rotate specific pages
POST   /api/pdf/:id/annotate    - Add annotations (text, image, shape)
GET    /api/pdf/:id/export      - Export edited PDF
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT