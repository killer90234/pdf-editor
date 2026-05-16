import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f3f4f6; overflow: hidden; }
  #root { height: 100%; width: 100%; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .btn { padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
  .btn-primary { background: #0ea5e9; color: white; }
  .btn-primary:hover { background: #0284c7; }
  .btn-secondary { background: #e5e7eb; color: #374151; }
  .btn-secondary:hover { background: #d1d5db; }
  .input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; }
  .input:focus { outline: none; border-color: #0ea5e9; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2); }
  .toolbar { background: white; border-bottom: 1px solid #e5e7eb; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; }
  .toolbar-btn { padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; margin-right: 4px; transition: all 0.2s; }
  .toolbar-btn.active { background: #0ea5e9; color: white; }
  .toolbar-btn:not(.active) { background: #f3f4f6; color: #374151; }
  .toolbar-btn:not(.active):hover { background: #e5e7eb; }
  .zoom-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; background: #f3f4f6; border: none; cursor: pointer; }
  .zoom-btn:hover { background: #e5e7eb; }
  .zoom-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .sidebar { width: 256px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
  .sidebar-header { padding: 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
  .sidebar-title { font-weight: 500; color: #111827; font-size: 14px; }
  .thumbnail-list { flex: 1; overflow-y: auto; padding: 8px; }
  .thumbnail { cursor: pointer; border: 2px solid #e5e7eb; border-radius: 4px; overflow: hidden; margin-bottom: 8px; transition: all 0.2s; }
  .thumbnail:hover { border-color: #9ca3af; }
  .thumbnail.active { border-color: #0ea5e9; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2); }
  .thumbnail-img { width: 100%; height: auto; }
  .thumbnail-label { text-align: center; font-size: 12px; color: #6b7280; padding: 4px; background: white; }
  .editor-area { flex: 1; overflow: auto; background: #f3f4f6; padding: 16px; display: flex; justify-content: center; }
  .pdf-page { position: relative; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
  .text-annotation { position: absolute; cursor: pointer; }
  .text-annotation.selected { outline: 2px solid #3b82f6; outline-offset: 2px; }
  .text-toolbar { background: white; border-top: 1px solid #e5e7eb; padding: 12px 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  .text-toolbar label { font-size: 14px; font-weight: 500; color: #374151; }
  .text-toolbar input[type="text"] { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; width: 192px; }
  .text-toolbar input[type="number"] { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; width: 64px; text-align: center; }
  .text-toolbar select { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; }
  .text-toolbar input[type="color"] { height: 24px; width: 24px; padding: 0; border: none; }
  .format-btn { padding: 4px 8px; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; }
  .format-btn.active { background: #e0f2fe; }
  .format-btn:not(.active) { background: #f3f4f6; }
  .home-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 32px; }
  .home-content { max-width: 800px; text-align: center; }
  .home-title { font-size: 36px; font-weight: 700; color: #111827; margin-bottom: 24px; }
  .home-subtitle { font-size: 18px; color: #6b7280; margin-bottom: 32px; }
  .dropzone { border: 2px dashed #d1d5db; border-radius: 12px; padding: 48px; text-align: center; cursor: pointer; transition: all 0.3s; }
  .dropzone:hover, .dropzone.dragover { border-color: #3b82f6; background: #eff6ff; }
  .dropzone-icon { width: 48px; height: 48px; margin: 0 auto 16px; color: #9ca3af; }
  .dropzone-text { font-size: 18px; font-weight: 500; color: #111827; margin-bottom: 8px; }
  .dropzone-subtext { font-size: 14px; color: #6b7280; }
  .choose-btn { margin-top: 24px; padding: 10px 20px; background: #3b82f6; color: white; border-radius: 6px; font-weight: 500; border: none; cursor: pointer; }
  .loading-spinner { width: 48px; height: 48px; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
  .loading-container { display: flex; flex-direction: column; align-items: center; gap: 16px; }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);