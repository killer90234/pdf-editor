# PDF Editor Web Portal - Setup Guide

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pdf-editor
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies

```bash
cd ../backend
npm install
```

## Development Setup

### Start the Backend Server

```bash
# From the backend directory
npm run dev
```
The backend will start on `http://localhost:5000`

### Start the Frontend Development Server

```bash
# From the frontend directory
npm run dev
```
The frontend will start on `http://localhost:5173` (or another port if 5173 is in use)

### Access the Application

Open your browser and navigate to `http://localhost:5173`

## Building for Production

### Build Frontend

```bash
cd frontend
npm run build
```
This will create a `dist` folder with optimized production assets.

### Build Backend (Optional)

The backend doesn't require a build step, but you can prepare it for production:

```bash
cd backend
npm run build
```
This simply echoes that no build step is required.

### Production Deployment

To serve the frontend from the backend in production:

1. Copy the contents of `frontend/dist` to `backend/public`
2. Start the backend with `npm start`
3. The application will be accessible at `http://localhost:5000`

## Environment Variables

Create a `.env` file in the backend directory if needed:

```
PORT=5000
NODE_ENV=development
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: If ports 5000 or 5173 are in use, change them in:
   - Backend: Modify `server.js` or set `PORT` environment variable
   - Frontend: Modify `vite.config.js`

2. **CORS Errors**: Ensure the backend CORS middleware is configured correctly in `server.js`

3. **File Upload Issues**: Check that the `uploads` directory has write permissions

4. **PDF Processing Errors**: Large PDFs may require increased memory limits in Node.js

## Project Structure Overview

```
pdf-editor/
├── frontend/                 # React/Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── FileManager.jsx     # File upload and listing
│   │   │   ├── PDFViewer.jsx       # PDF rendering with pdf.js
│   │   │   ├── Sidebar.jsx         # Left navigation panel
│   │   │   └── Toolbar.jsx         # Top action toolbar
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── usePDFStore.js      # State management for PDFs
│   │   ├── utils/            # Utility functions
│   │   ├── App.jsx           # Main application component
│   │   ├── index.css         # Global styles
│   │   └── main.jsx          # Entry point
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── postcss.config.js     # PostCSS configuration
│   ├── vite.config.js        # Vite configuration
│   ├── index.html            # HTML template
│   └── package.json          # Frontend dependencies
├── backend/                  # Node.js/Express backend
│   ├── server.js             # Main server file with API routes
│   ├── package.json          # Backend dependencies
│   └── (uploads/ directory created at runtime)
├── README.md                 # Project overview
└── SETUP_GUIDE.md            # This file
```

## API Endpoints

All API endpoints are prefixed with `/api/pdf`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload a PDF file |
| GET | `/:id` | Retrieve a PDF file by ID |
| DELETE | `/:id` | Delete a PDF file by ID |
| POST | `/:id/merge` | Merge with another PDF |
| POST | `/:id/split` | Split PDF at page range |
| POST | `/:id/rotate` | Rotate specific pages |
| POST | `/:id/annotate` | Add annotations (text, image, shape) |
| GET | `/:id/export` | Export edited PDF |

## Features Implemented

### Core Functionality
- ✅ PDF Upload (drag & drop + file picker)
- ✅ PDF Listing and Management
- ✅ PDF Viewer with zoom and navigation
- ✅ Page Operations (merge, split, rotate)
- ✅ Annotation Tools (text, images, shapes)
- ✅ PDF Export and Download

### Technical Implementation
- ✅ React 18 with Vite for fast development
- ✅ Tailwind CSS for responsive styling
- ✅ Express.js REST API
- ✅ pdf-lib for PDF manipulation
- ✅ PDF.js for PDF rendering
- ✅ Multer for file upload handling
- ✅ Proper error handling and validation
- ✅ Modular, component-based architecture

## Future Enhancements

Consider implementing these features for a more complete solution:

1. **Advanced Editing**:
   - True text editing (not just overlay)
   - Text formatting options (font, size, color, alignment)
   - Spell check integration

2. **User Experience**:
   - Undo/redo functionality
   - Autosave with IndexedDB/localStorage
   - Keyboard shortcuts
   - Dark/light mode toggle
   - Improved annotation positioning UI

3. **Performance**:
   - Web Workers for heavy PDF operations
   - Virtual scrolling for large PDFs
   - Lazy loading of thumbnails
   - Progressive loading for preview

4. **Security**:
   - Enhanced file type validation
   - Content security policy
   - Rate limiting for API endpoints
   - Input sanitization for all user data

5. **Additional Features**:
   - Digital signature support
   - Watermarking tools
   - PDF compression options
   - Page extraction
   - PDF encryption/decryption
   - Form filling capabilities

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please refer to the project documentation or contact the maintainers.