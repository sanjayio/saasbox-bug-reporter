// Tiny CSS-in-JS utility for bug reporter widget
// Replaces CSS loaders to save ~12KB bundle size

let styleElement = null;

export function injectStyles() {
  if (styleElement) return; // Already injected
  
  styleElement = document.createElement('style');
  styleElement.setAttribute('data-bug-reporter', 'true');
  
  // All widget styles in a single injection
  styleElement.textContent = `
/* Bug Reporter Widget Styles */

.br-trigger-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 999998;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 24px;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.br-trigger-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.br-widget {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: none;
}

.br-widget.br-active {
  display: flex;
}

.br-selection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000000;
  backdrop-filter: blur(2px);
}

.br-selection-area {
  position: absolute;
  border: 2px solid #667eea;
  background: rgba(102, 126, 234, 0.1);
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.3);
  display: none;
}

.br-crosshair-h, .br-crosshair-v {
  position: absolute;
  background: rgba(102, 126, 234, 0.8);
  pointer-events: none;
}

.br-crosshair-h {
  height: 1px;
  width: 100%;
  left: 0;
}

.br-crosshair-v {
  width: 1px;
  height: 100%;
  top: 0;
}

.br-selection-info {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1000001;
}

.br-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999999;
}

.br-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 1000000;
}

.br-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.br-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.br-close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.br-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.br-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.br-form-group {
  margin-bottom: 20px;
}

.br-form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.br-form-group textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.br-form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.br-footer {
  padding: 20px;
  border-top: 1px solid #e1e5e9;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.br-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.br-btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.br-btn-submit:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

.br-btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.br-btn-cancel {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.br-btn-cancel:hover {
  background: #e9ecef;
}

.br-loading {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: br-spin 0.6s linear infinite;
}

@keyframes br-spin {
  to { transform: rotate(360deg); }
}

.br-message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
}

.br-message-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.br-message-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.br-message-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.br-screenshot-preview {
  margin-bottom: 20px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
}

.br-screenshot-toolbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 8px;
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.br-toolbar-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.br-toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.br-toolbar-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
  transform: none;
}

.br-toolbar-btn.active {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.br-color-selector {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-left: auto;
}

.br-color-picker {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  padding: 8px;
  display: none;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}

/* Make sure color picker appears above all other elements */
.br-color-picker.br-show {
  display: flex !important;
  position: fixed !important;
  z-index: 1000001 !important;
}

.br-color-btn {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
}

.br-color-btn:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.6);
}

.br-color-btn.active {
  border-color: #ffffff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.br-screenshot-container {
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  max-height: 400px;
  overflow: hidden;
}

.br-screenshot-container img {
  width: 100%;
  height: auto;
  display: block;
}

.br-arrows-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.br-text-annotation {
  position: absolute;
  color: #ef4444;
  font-size: 16px;
  font-weight: bold;
  cursor: text;
  user-select: text;
  z-index: 11;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  min-width: 40px;
  min-height: 20px;
  outline: none;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.br-text-annotation:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

/* Dark mode support - removed to allow custom colors */
`;
  
  document.head.appendChild(styleElement);
}

export function removeStyles() {
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
    styleElement = null;
  }
}