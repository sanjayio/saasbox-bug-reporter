import './styles.css';
import ConsoleLogger from './utils/logger';
import NetworkMonitor from './utils/network';
import { getSystemInfo } from './utils/system';
import { captureScreenshot, captureScreenshotArea } from './utils/screenshot';

class BugReporter {
  constructor() {
    this.config = {
      apiEndpoint: '',
      saasBoxKey: '',
      saasBoxSecret: '',
      // Trigger button customization
      position: 'bottom-right',
      offsetX: 20,
      offsetY: 20,
      buttonSize: 60,
      buttonShape: 'circle',
      buttonIcon: '🐛',
      buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      buttonShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      // Modal customization
      modalTitle: 'Report a Bug',
      modalHeaderColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      modalHeaderTextColor: '#ffffff',
      modalPrimaryColor: '#667eea',
      modalDescriptionLabel: 'Describe the issue',
      modalDescriptionPlaceholder: 'Please describe what went wrong...',
      modalSubmitText: 'Submit Report',
      modalCancelText: 'Cancel',
      // Screenshot capture mode: 'selection' (area selection) or 'full' (full viewport)
      screenshotMode: 'selection'
    };
    this.logger = new ConsoleLogger(50);
    this.networkMonitor = new NetworkMonitor(20);
    this.screenshotBlob = null;
    this.isOpen = false;
    this.arrowMode = false;
    this.textMode = false;
    this.freehandMode = false;
    this.selectedColor = 'red';
    this.arrows = [];
    this.texts = [];
    this.freehandPaths = [];
    this.currentArrow = null;
    this.currentText = null;
    this.currentPath = null;
    this.draggingArrow = null;
    this.resizingAnchor = null;
    this.arrowHistory = []; // Array of annotation states for undo
    this.arrowHistoryIndex = -1; // Current position in history
    this.selectionMode = false;
    this.selectionStart = null;
    this.selectionEnd = null;
  }

  init(config = {}) {
    this.config = { ...this.config, ...config };

    if (!this.config.apiEndpoint) {
      console.warn('BugReporter: No API endpoint configured');
    }

    if (!this.config.saasBoxKey) {
      console.warn('BugReporter: No saasBoxKey configured');
    }

    if (!this.config.saasBoxSecret) {
      console.warn('BugReporter: No saasBoxSecret configured');
    }

    this.logger.startIntercepting();
    this.networkMonitor.startMonitoring();

    this.injectStyles();
    this.injectUI();
    this.attachEventListeners();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.id = 'br-custom-styles';
    
    const positionStyles = this.getPositionStyles();
    const borderRadius = this.config.buttonShape === 'circle' ? '50%' : 
                        this.config.buttonShape === 'rounded' ? '12px' : '4px';
    
    style.textContent = `
      .br-trigger-btn {
        ${positionStyles}
        width: ${this.config.buttonSize}px !important;
        height: ${this.config.buttonSize}px !important;
        border-radius: ${borderRadius} !important;
        background: ${this.config.buttonColor} !important;
        box-shadow: ${this.config.buttonShadow} !important;
        font-size: ${Math.floor(this.config.buttonSize * 0.4)}px !important;
      }
      
      .br-header {
        background: ${this.config.modalHeaderColor} !important;
        color: ${this.config.modalHeaderTextColor} !important;
      }
      
      .br-form-group textarea:focus {
        border-color: ${this.config.modalPrimaryColor} !important;
      }
      
      .br-btn-submit {
        background: ${this.config.modalHeaderColor} !important;
      }
      
      .br-btn-submit:hover {
        box-shadow: 0 4px 12px ${this.hexToRgba(this.config.modalPrimaryColor, 0.4)} !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  getPositionStyles() {
    const positions = {
      'top-left': `top: ${this.config.offsetY}px; left: ${this.config.offsetX}px;`,
      'top-right': `top: ${this.config.offsetY}px; right: ${this.config.offsetX}px;`,
      'bottom-left': `bottom: ${this.config.offsetY}px; left: ${this.config.offsetX}px;`,
      'bottom-right': `bottom: ${this.config.offsetY}px; right: ${this.config.offsetX}px;`
    };
    return positions[this.config.position] || positions['bottom-right'];
  }

  hexToRgba(color, alpha = 1) {
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  injectUI() {
    const triggerBtn = document.createElement('button');
    triggerBtn.className = 'br-trigger-btn';
    triggerBtn.innerHTML = this.config.buttonIcon;
    triggerBtn.title = 'Report a bug';
    document.body.appendChild(triggerBtn);

    const widget = document.createElement('div');
    widget.className = 'br-widget';
    widget.innerHTML = `
      <div class="br-selection-overlay" style="display: none;">
        <div class="br-selection-area"></div>
        <div class="br-crosshair-h"></div>
        <div class="br-crosshair-v"></div>
        <div class="br-selection-info">Click and drag to select area, or press ESC to cancel</div>
      </div>
      <div class="br-overlay"></div>
      <div class="br-modal">
        <div class="br-header">
          <h2>${this.config.modalTitle}</h2>
          <button class="br-close-btn">×</button>
        </div>
        <div class="br-body">
          <div class="br-screenshot-preview" style="display: none;">
            <div class="br-screenshot-toolbar">
              <button class="br-toolbar-btn br-arrow-btn" title="Add arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button class="br-toolbar-btn br-text-btn" title="Add text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 20h16M6 16l6-12 6 12M8 12h8"/>
                </svg>
              </button>
              <button class="br-toolbar-btn br-freehand-btn" title="Freehand draw">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3l18 18M12 5c-2 0-4 1-5 3M9 9c-1 1-1 2-1 3 0 2 2 4 4 4 1 0 2 0 3-1M15 7c1-2 3-3 5-3M21 21c-2-2-3-4-3-6 0-1 0-2 1-3"/>
                </svg>
              </button>
              <button class="br-toolbar-btn br-undo-btn" title="Undo" disabled>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
                </svg>
              </button>
              <button class="br-toolbar-btn br-redo-btn" title="Redo" disabled>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 7v6h-6M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>
                </svg>
              </button>
              <button class="br-toolbar-btn br-clear-btn" title="Clear all annotations">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
              <div class="br-color-dropdown">
                <button class="br-toolbar-btn br-color-dropdown-btn" title="Select color">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                    <circle cx="11.5" cy="11.5" r=".5" fill="currentColor"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                </button>
                <div class="br-color-picker">
                  <button class="br-color-btn" data-color="red" style="background: #ef4444;" title="Red"></button>
                  <button class="br-color-btn" data-color="blue" style="background: #3b82f6;" title="Blue"></button>
                  <button class="br-color-btn" data-color="green" style="background: #10b981;" title="Green"></button>
                  <button class="br-color-btn" data-color="yellow" style="background: #f59e0b;" title="Yellow"></button>
                  <button class="br-color-btn" data-color="white" style="background: #ffffff; border: 1px solid #ddd;" title="White"></button>
                  <button class="br-color-btn" data-color="black" style="background: #000000;" title="Black"></button>
                </div>
              </div>
            </div>
            <div class="br-screenshot-container">
              <img src="" alt="Screenshot preview" />
              <svg class="br-arrows-overlay"></svg>
            </div>
          </div>
          <div class="br-form-group">
            <label for="br-description">${this.config.modalDescriptionLabel}</label>
            <textarea 
              id="br-description" 
              placeholder="${this.config.modalDescriptionPlaceholder}"
              required
            ></textarea>
          </div>
        </div>
        <div class="br-footer">
          <button class="br-btn br-btn-cancel">${this.config.modalCancelText}</button>
          <button class="br-btn br-btn-submit">${this.config.modalSubmitText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    this.elements = {
      triggerBtn,
      widget,
      selectionOverlay: widget.querySelector('.br-selection-overlay'),
      selectionArea: widget.querySelector('.br-selection-area'),
      crosshairH: widget.querySelector('.br-crosshair-h'),
      crosshairV: widget.querySelector('.br-crosshair-v'),
      selectionInfo: widget.querySelector('.br-selection-info'),
      overlay: widget.querySelector('.br-overlay'),
      closeBtn: widget.querySelector('.br-close-btn'),
      cancelBtn: widget.querySelector('.br-btn-cancel'),
      submitBtn: widget.querySelector('.br-btn-submit'),
      description: widget.querySelector('#br-description'),
      screenshotPreview: widget.querySelector('.br-screenshot-preview'),
      screenshotImg: widget.querySelector('.br-screenshot-preview img'),
      screenshotContainer: widget.querySelector('.br-screenshot-container'),
      arrowsOverlay: widget.querySelector('.br-arrows-overlay'),
      arrowBtn: widget.querySelector('.br-arrow-btn'),
      textBtn: widget.querySelector('.br-text-btn'),
      freehandBtn: widget.querySelector('.br-freehand-btn'),
      undoBtn: widget.querySelector('.br-undo-btn'),
      redoBtn: widget.querySelector('.br-redo-btn'),
      clearBtn: widget.querySelector('.br-clear-btn'),
      colorDropdownBtn: widget.querySelector('.br-color-dropdown-btn'),
      colorPicker: widget.querySelector('.br-color-picker'),
      colorBtns: widget.querySelectorAll('.br-color-btn'),
      body: widget.querySelector('.br-body')
    };
  }

  attachEventListeners() {
    this.elements.triggerBtn.addEventListener('click', () => {
      if (this.config.screenshotMode === 'selection') {
        this.startSelectionMode();
      } else {
        this.open();
      }
    });
    this.elements.overlay.addEventListener('click', () => this.close());
    this.elements.closeBtn.addEventListener('click', () => this.close());
    this.elements.cancelBtn.addEventListener('click', () => this.close());
    this.elements.submitBtn.addEventListener('click', () => this.submit());

    // Annotation tools
    this.elements.arrowBtn.addEventListener('click', () => this.toggleArrowMode());
    this.elements.textBtn.addEventListener('click', () => this.toggleTextMode());
    this.elements.freehandBtn.addEventListener('click', () => this.toggleFreehandMode());
    this.elements.undoBtn.addEventListener('click', () => this.undo());
    this.elements.redoBtn.addEventListener('click', () => this.redo());
    this.elements.clearBtn.addEventListener('click', () => this.clearAllAnnotations());
    
    // Color dropdown
    if (this.elements.colorDropdownBtn) {
      this.elements.colorDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleColorDropdown();
      });
    }
    
    this.elements.colorBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedColor = e.target.dataset.color;
        this.elements.colorBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.closeColorDropdown();
      });
    });
    
    // Set initial active color
    if (this.elements.colorBtns.length > 0) {
      this.elements.colorBtns[0].classList.add('active');
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.elements.colorPicker && !this.elements.colorPicker.contains(e.target) && 
          this.elements.colorDropdownBtn && !this.elements.colorDropdownBtn.contains(e.target)) {
        this.closeColorDropdown();
      }
    });

    // Screenshot container events for arrow drawing
    if (this.elements.screenshotContainer) {
      this.elements.screenshotContainer.addEventListener('mousedown', (e) => this.handleScreenshotMouseDown(e), true);
      this.elements.screenshotContainer.addEventListener('mousemove', (e) => this.handleScreenshotMouseMove(e), true);
      this.elements.screenshotContainer.addEventListener('mouseup', () => this.handleScreenshotMouseUp(), true);
      
      // Also listen on the image directly
      if (this.elements.screenshotImg) {
        this.elements.screenshotImg.addEventListener('mousedown', (e) => this.handleScreenshotMouseDown(e), true);
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.selectionMode) {
          this.cancelSelectionMode();
        } else if (this.isOpen) {
          if (this.arrowMode) {
            this.toggleArrowMode();
          } else {
            this.close();
          }
        }
      }
    });
    
    // Selection mode events
    if (this.elements.selectionOverlay) {
      this.elements.selectionOverlay.addEventListener('mousedown', (e) => this.handleSelectionStart(e));
    }
    
    // Global mouse move for crosshairs
    document.addEventListener('mousemove', (e) => {
      if (this.selectionMode) {
        this.handleSelectionMove(e);
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      if (this.selectionMode) {
        this.handleSelectionEnd(e);
      }
    });
  }

  startSelectionMode() {
    this.selectionMode = true;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.elements.widget.classList.add('br-active');
    this.elements.selectionOverlay.style.display = 'block';
    this.elements.overlay.style.display = 'none';
    this.elements.widget.querySelector('.br-modal').style.display = 'none';
    document.body.style.cursor = 'crosshair';
    document.body.style.userSelect = 'none';
  }

  cancelSelectionMode() {
    this.selectionMode = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.elements.widget.classList.remove('br-active');
    this.elements.selectionOverlay.style.display = 'none';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    this.updateSelectionDisplay();
  }

  handleSelectionStart(e) {
    if (!this.selectionMode) return;
    e.preventDefault();
    this.selectionStart = { x: e.clientX, y: e.clientY };
    this.selectionEnd = { x: e.clientX, y: e.clientY };
    this.updateSelectionDisplay();
  }

  handleSelectionMove(e) {
    if (!this.selectionMode) return;
    this.updateCrosshairs(e.clientX, e.clientY);
    if (this.selectionStart) {
      this.selectionEnd = { x: e.clientX, y: e.clientY };
      this.updateSelectionDisplay();
    }
  }

  handleSelectionEnd(e) {
    if (!this.selectionMode || !this.selectionStart) return;
    
    const rect = {
      x: Math.min(this.selectionStart.x, this.selectionEnd.x),
      y: Math.min(this.selectionStart.y, this.selectionEnd.y),
      width: Math.abs(this.selectionEnd.x - this.selectionStart.x),
      height: Math.abs(this.selectionEnd.y - this.selectionStart.y)
    };
    
    if (rect.width > 10 && rect.height > 10) {
      this.captureSelectedArea(rect);
    } else {
      this.cancelSelectionMode();
    }
  }

  updateCrosshairs(x, y) {
    if (this.elements.crosshairH && this.elements.crosshairV) {
      this.elements.crosshairH.style.top = `${y}px`;
      this.elements.crosshairV.style.left = `${x}px`;
    }
  }

  updateSelectionDisplay() {
    if (!this.selectionStart || !this.selectionEnd) {
      if (this.elements.selectionArea) {
        this.elements.selectionArea.style.display = 'none';
      }
      return;
    }

    const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
    const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);

    if (this.elements.selectionArea) {
      this.elements.selectionArea.style.display = 'block';
      this.elements.selectionArea.style.left = `${x}px`;
      this.elements.selectionArea.style.top = `${y}px`;
      this.elements.selectionArea.style.width = `${width}px`;
      this.elements.selectionArea.style.height = `${height}px`;
    }

    if (this.elements.selectionInfo) {
      this.elements.selectionInfo.textContent = `${Math.round(width)} × ${Math.round(height)}px`;
    }
  }

  async captureSelectedArea(rect) {
    this.selectionMode = false;
    this.elements.selectionOverlay.style.display = 'none';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    this.elements.widget.querySelector('.br-modal').style.display = '';
    this.elements.overlay.style.display = '';
    this.isOpen = true;
    this.elements.description.value = '';
    this.elements.description.focus();
    this.arrows = [];
    this.texts = [];
    this.freehandPaths = [];
    this.arrowMode = false;
    this.textMode = false;
    this.freehandMode = false;
    this.currentArrow = null;
    this.currentText = null;
    this.currentPath = null;

    this.showMessage('Capturing screenshot...', 'info');

    try {
      this.screenshotBlob = await captureScreenshotArea(rect);
      const url = URL.createObjectURL(this.screenshotBlob);
      this.elements.screenshotImg.src = url;
      this.elements.screenshotPreview.style.display = 'block';
      
      // Wait for image to load before updating overlay
      if (this.elements.screenshotImg.complete) {
        setTimeout(() => {
          this.updateArrowsOverlay();
          this.updateTextAnnotations();
          this.updateUndoRedoButtons();
        }, 100);
      } else {
        this.elements.screenshotImg.onload = () => {
          setTimeout(() => {
            this.updateArrowsOverlay();
            this.updateTextAnnotations();
            this.updateUndoRedoButtons();
          }, 100);
        };
      }
      
      // Initialize history with empty state
      this.arrowHistory = [this.getAnnotationState()];
      this.arrowHistoryIndex = 0;
      
      this.clearMessages();
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      this.showMessage('Failed to capture screenshot, but you can still report the bug.', 'error');
      this.screenshotBlob = null;
    }
  }

  async open() {
    // Full screenshot mode - capture entire viewport immediately
    this.isOpen = true;
    this.elements.widget.classList.add('br-active');
    this.elements.description.value = '';
    this.elements.description.focus();
    this.arrows = [];
    this.texts = [];
    this.freehandPaths = [];
    this.arrowMode = false;
    this.textMode = false;
    this.freehandMode = false;
    this.currentArrow = null;
    this.currentText = null;
    this.currentPath = null;

    this.showMessage('Capturing screenshot...', 'info');

    try {
      this.screenshotBlob = await captureScreenshot();
      const url = URL.createObjectURL(this.screenshotBlob);
      this.elements.screenshotImg.src = url;
      this.elements.screenshotPreview.style.display = 'block';
      
      // Wait for image to load before updating overlay
      if (this.elements.screenshotImg.complete) {
        setTimeout(() => {
          this.updateArrowsOverlay();
          this.updateTextAnnotations();
          this.updateUndoRedoButtons();
        }, 100);
      } else {
        this.elements.screenshotImg.onload = () => {
          setTimeout(() => {
            this.updateArrowsOverlay();
            this.updateTextAnnotations();
            this.updateUndoRedoButtons();
          }, 100);
        };
      }
      
      // Initialize history with empty state
      this.arrowHistory = [this.getAnnotationState()];
      this.arrowHistoryIndex = 0;
      
      this.clearMessages();
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      this.showMessage('Failed to capture screenshot, but you can still report the bug.', 'error');
      this.screenshotBlob = null;
    }
  }

  close() {
    this.isOpen = false;
    this.selectionMode = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.elements.widget.classList.remove('br-active');
    if (this.elements.selectionOverlay) {
      this.elements.selectionOverlay.style.display = 'none';
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    this.clearMessages();
    this.arrowMode = false;
    this.textMode = false;
    this.freehandMode = false;
    this.arrows = [];
    this.texts = [];
    this.freehandPaths = [];
    this.currentArrow = null;
    this.currentText = null;
    this.currentPath = null;
    this.arrowHistory = [];
    this.arrowHistoryIndex = -1;
    this.updateArrowsOverlay();
    this.updateTextAnnotations();
    this.updateUndoRedoButtons();
    this.elements.arrowBtn.classList.remove('active');
    this.elements.textBtn.classList.remove('active');
    this.elements.freehandBtn.classList.remove('active');
    this.closeColorDropdown();
    
    if (this.screenshotBlob) {
      URL.revokeObjectURL(this.elements.screenshotImg.src);
    }
  }

  showMessage(text, type = 'info') {
    this.clearMessages();
    const message = document.createElement('div');
    message.className = `br-message br-message-${type}`;
    message.textContent = text;
    this.elements.body.insertBefore(message, this.elements.body.firstChild);
  }

  clearMessages() {
    const messages = this.elements.body.querySelectorAll('.br-message');
    messages.forEach(msg => msg.remove());
  }

  async submit() {
    const description = this.elements.description.value.trim();

    if (!description) {
      this.showMessage('Please describe the issue', 'error');
      return;
    }

    if (!this.config.apiEndpoint) {
      this.showMessage('No API endpoint configured', 'error');
      return;
    }

    this.elements.submitBtn.disabled = true;
    this.elements.submitBtn.innerHTML = '<span class="br-loading"></span>Submitting...';

    try {
      let screenshotBlob = this.screenshotBlob;
      
      // If there are annotations, render them on the screenshot
      if (this.screenshotBlob && (this.arrows.length > 0 || this.texts.length > 0 || this.freehandPaths.length > 0)) {
        screenshotBlob = await this.renderArrowsOnScreenshot();
      }

      const formData = new FormData();
      
      formData.append('description', description);
      
      if (this.config.saasBoxKey) {
        formData.append('saasBoxKey', this.config.saasBoxKey);
      }
      
      if (this.config.saasBoxSecret) {
        formData.append('saasBoxSecret', this.config.saasBoxSecret);
      }
      
      if (screenshotBlob) {
        formData.append('screenshot', screenshotBlob, 'screenshot.png');
      }
      
      formData.append('consoleLogs', JSON.stringify(this.logger.getLogs()));
      formData.append('networkRequests', JSON.stringify(this.networkMonitor.getRequests()));
      formData.append('systemInfo', JSON.stringify(getSystemInfo()));

      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.showMessage('Bug report submitted successfully!', 'success');
      
      setTimeout(() => {
        this.close();
      }, 2000);

    } catch (error) {
      console.error('Failed to submit bug report:', error);
      this.showMessage('Failed to submit bug report. Please try again.', 'error');
    } finally {
      this.elements.submitBtn.disabled = false;
      this.elements.submitBtn.textContent = this.config.modalSubmitText;
    }
  }

  toggleArrowMode() {
    this.arrowMode = !this.arrowMode;
    this.textMode = false;
    this.freehandMode = false;
    this.elements.arrowBtn.classList.toggle('active', this.arrowMode);
    this.elements.textBtn.classList.remove('active');
    this.elements.freehandBtn.classList.remove('active');
    this.updateCursor();
    this.updateArrowsOverlay();
  }

  toggleTextMode() {
    this.textMode = !this.textMode;
    this.arrowMode = false;
    this.freehandMode = false;
    this.elements.textBtn.classList.toggle('active', this.textMode);
    this.elements.arrowBtn.classList.remove('active');
    this.elements.freehandBtn.classList.remove('active');
    this.updateCursor();
  }

  toggleFreehandMode() {
    this.freehandMode = !this.freehandMode;
    this.arrowMode = false;
    this.textMode = false;
    this.elements.freehandBtn.classList.toggle('active', this.freehandMode);
    this.elements.arrowBtn.classList.remove('active');
    this.elements.textBtn.classList.remove('active');
    this.updateCursor();
    this.updateArrowsOverlay();
  }

  updateCursor() {
    if (!this.elements.screenshotContainer) return;
    let cursor = 'default';
    if (this.arrowMode) cursor = 'crosshair';
    else if (this.textMode) cursor = 'text';
    else if (this.freehandMode) cursor = 'crosshair';
    
    this.elements.screenshotContainer.style.cursor = cursor;
    if (this.elements.screenshotImg) {
      this.elements.screenshotImg.style.cursor = cursor;
    }
  }

  toggleColorDropdown() {
    if (this.elements.colorPicker && this.elements.colorDropdownBtn) {
      const isShowing = this.elements.colorPicker.classList.contains('br-show');
      
      if (isShowing) {
        this.closeColorDropdown();
      } else {
        // Calculate position for fixed dropdown
        const btnRect = this.elements.colorDropdownBtn.getBoundingClientRect();
        this.elements.colorPicker.style.top = `${btnRect.bottom + 8}px`;
        this.elements.colorPicker.style.left = `${btnRect.left}px`;
        
        this.elements.colorPicker.classList.add('br-show');
        this.elements.colorDropdownBtn.classList.add('active');
      }
    }
  }

  closeColorDropdown() {
    if (this.elements.colorPicker) {
      this.elements.colorPicker.classList.remove('br-show');
      this.elements.colorDropdownBtn.classList.remove('active');
    }
  }

  handleScreenshotMouseDown(e) {
    if (!this.elements.screenshotContainer) return;
    
    const rect = this.elements.screenshotContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Handle text mode
    if (this.textMode) {
      // Don't create text if clicking on existing text
      if (e.target.closest('.br-text-annotation')) {
        return;
      }
      
      // Create new text annotation
      this.createTextAnnotation(x, y);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Handle freehand mode
    if (this.freehandMode) {
      // Don't start drawing if clicking on existing annotations
      if (e.target.closest('g[data-arrow-id]') || e.target.closest('.br-text-annotation') || e.target.closest('path[data-path-id]')) {
        return;
      }
      
      // Start new freehand path
      this.currentPath = {
        id: Date.now(),
        points: [{ x, y }],
        color: this.selectedColor
      };
      this.freehandPaths.push(this.currentPath);
      this.updateArrowsOverlay();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Handle arrow mode
    if (this.arrowMode) {
      // Don't start drawing if clicking on an existing arrow or its anchors
      if (e.target.closest('g[data-arrow-id]') || e.target.tagName === 'circle' || e.target.tagName === 'line' || e.target.tagName === 'polygon') {
        return;
      }
      
      // Only start drawing if clicking on the image or container background
      if (e.target.tagName !== 'IMG' && e.target !== this.elements.screenshotContainer && e.target !== this.elements.arrowsOverlay) {
        return;
      }
      
      // Start new arrow
      this.currentArrow = {
        id: Date.now(),
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        color: this.selectedColor
      };
      this.arrows.push(this.currentArrow);
      
      // Force immediate update
      this.updateArrowsOverlay();
      
      // Prevent default to avoid text selection
      e.preventDefault();
      e.stopPropagation();
    }
  }

  handleScreenshotMouseMove(e) {
    if (!this.elements.screenshotContainer) return;
    
    const rect = this.elements.screenshotContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Handle freehand drawing
    if (this.freehandMode && this.currentPath) {
      this.currentPath.points.push({ x, y });
      this.updateArrowsOverlay();
      return;
    }
    
    // Handle arrow drawing
    if (this.arrowMode && this.currentArrow) {
      // Drawing new arrow
      // Clamp coordinates to container bounds
      const maxX = rect.width || this.elements.screenshotContainer.offsetWidth;
      const maxY = rect.height || this.elements.screenshotContainer.offsetHeight;
      
      this.currentArrow.x2 = Math.max(0, Math.min(x, maxX));
      this.currentArrow.y2 = Math.max(0, Math.min(y, maxY));
      this.updateArrowsOverlay();
    }
  }

  handleScreenshotMouseUp() {
    // Complete freehand drawing
    if (this.currentPath) {
      // Only keep path if it has meaningful length
      if (this.currentPath.points.length < 3) {
        this.freehandPaths = this.freehandPaths.filter(p => p.id !== this.currentPath.id);
      } else {
        // Save state to history after completing path
        this.saveArrowState();
      }
      this.currentPath = null;
      this.updateArrowsOverlay();
      this.updateUndoRedoButtons();
    }
    
    // Complete arrow drawing
    if (this.currentArrow) {
      // Only keep arrow if it has meaningful length
      const dx = this.currentArrow.x2 - this.currentArrow.x1;
      const dy = this.currentArrow.y2 - this.currentArrow.y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length < 10) {
        // Remove arrow if too short
        this.arrows = this.arrows.filter(a => a.id !== this.currentArrow.id);
      } else {
        // Save state to history after completing arrow
        this.saveArrowState();
      }
      
      this.currentArrow = null;
      this.updateArrowsOverlay();
      this.updateUndoRedoButtons();
    }
    
    // Handle arrow dragging and resizing
    if (this.draggingArrow || this.resizingAnchor) {
      // Save state after dragging/resizing
      this.saveArrowState();
      this.draggingArrow = null;
      this.resizingAnchor = null;
      this.updateUndoRedoButtons();
    }
  }

  updateArrowsOverlay() {
    if (!this.elements.arrowsOverlay) return;
    
    const svg = this.elements.arrowsOverlay;
    const container = this.elements.screenshotContainer;
    if (!container) return;
    
    // Use the image dimensions if available, otherwise use container
    const img = this.elements.screenshotImg;
    let width, height;
    
    if (img && img.complete && img.naturalWidth > 0) {
      // Use actual image dimensions scaled to container
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width || container.offsetWidth;
      const scale = containerWidth / img.naturalWidth;
      width = containerWidth;
      height = img.naturalHeight * scale;
    } else {
      const rect = container.getBoundingClientRect();
      width = rect.width || container.offsetWidth;
      height = rect.height || container.offsetHeight;
    }
    
    if (width === 0 || height === 0) {
      // Container not ready yet, try again after a short delay
      setTimeout(() => this.updateArrowsOverlay(), 100);
      return;
    }
    
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'auto';
    svg.style.zIndex = '10';
    svg.style.display = 'block';
    
    // Clear existing content
    svg.innerHTML = '';
    
    // Draw all freehand paths
    this.freehandPaths.forEach(path => {
      if (path.points.length < 2) return;
      
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const colorMap = {
        red: '#ef4444',
        blue: '#3b82f6',
        green: '#10b981',
        yellow: '#f59e0b',
        white: '#ffffff',
        black: '#000000'
      };
      const color = colorMap[path.color] || colorMap.red;
      
      let pathData = `M ${path.points[0].x} ${path.points[0].y}`;
      for (let i = 1; i < path.points.length; i++) {
        pathData += ` L ${path.points[i].x} ${path.points[i].y}`;
      }
      
      pathElement.setAttribute('d', pathData);
      pathElement.setAttribute('stroke', color);
      pathElement.setAttribute('fill', 'none');
      pathElement.setAttribute('stroke-width', '3');
      pathElement.setAttribute('stroke-linecap', 'round');
      pathElement.setAttribute('stroke-linejoin', 'round');
      pathElement.setAttribute('data-path-id', path.id);
      svg.appendChild(pathElement);
    });
    
    // Draw all arrows
    this.arrows.forEach(arrow => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('data-arrow-id', arrow.id);
      group.style.pointerEvents = 'all';
      group.style.cursor = 'move';
      
      const colorMap = {
        red: '#ef4444',
        blue: '#3b82f6',
        green: '#10b981',
        yellow: '#f59e0b',
        white: '#ffffff',
        black: '#000000'
      };
      
      const color = colorMap[arrow.color] || colorMap.red;
      
      // Calculate arrow direction
      const dx = arrow.x2 - arrow.x1;
      const dy = arrow.y2 - arrow.y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      // Arrow head size
      const headLength = 15;
      const headWidth = 10;
      
      // Arrow line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', arrow.x1);
      line.setAttribute('y1', arrow.y1);
      line.setAttribute('x2', arrow.x2);
      line.setAttribute('y2', arrow.y2);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '3');
      line.setAttribute('stroke-linecap', 'round');
      group.appendChild(line);
      
      // Arrow head
      if (length > 0) {
        const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = [
          [arrow.x2, arrow.y2],
          [
            arrow.x2 - headLength * Math.cos(angle) + headWidth * Math.sin(angle),
            arrow.y2 - headLength * Math.sin(angle) - headWidth * Math.cos(angle)
          ],
          [
            arrow.x2 - headLength * Math.cos(angle) - headWidth * Math.sin(angle),
            arrow.y2 - headLength * Math.sin(angle) + headWidth * Math.cos(angle)
          ]
        ];
        arrowHead.setAttribute('points', points.map(p => p.join(',')).join(' '));
        arrowHead.setAttribute('fill', color);
        group.appendChild(arrowHead);
      }
      
      // Resize anchors
      const anchorSize = 8;
      
      // Start anchor
      const startAnchor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      startAnchor.setAttribute('cx', arrow.x1);
      startAnchor.setAttribute('cy', arrow.y1);
      startAnchor.setAttribute('r', anchorSize);
      startAnchor.setAttribute('fill', color);
      startAnchor.setAttribute('stroke', '#ffffff');
      startAnchor.setAttribute('stroke-width', '2');
      startAnchor.style.cursor = 'move';
      startAnchor.setAttribute('data-anchor', 'start');
      startAnchor.setAttribute('data-arrow-id', arrow.id);
      group.appendChild(startAnchor);
      
      // End anchor
      const endAnchor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      endAnchor.setAttribute('cx', arrow.x2);
      endAnchor.setAttribute('cy', arrow.y2);
      endAnchor.setAttribute('r', anchorSize);
      endAnchor.setAttribute('fill', color);
      endAnchor.setAttribute('stroke', '#ffffff');
      endAnchor.setAttribute('stroke-width', '2');
      endAnchor.style.cursor = 'move';
      endAnchor.setAttribute('data-anchor', 'end');
      endAnchor.setAttribute('data-arrow-id', arrow.id);
      group.appendChild(endAnchor);
      
      // Make group draggable (only when not in arrow drawing mode)
      if (!this.arrowMode) {
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let arrowStartX1 = 0;
        let arrowStartY1 = 0;
        let arrowStartX2 = 0;
        let arrowStartY2 = 0;
        
        const startDrag = (e) => {
          isDragging = true;
          const containerRect = container.getBoundingClientRect();
          dragStartX = e.clientX - containerRect.left;
          dragStartY = e.clientY - containerRect.top;
          arrowStartX1 = arrow.x1;
          arrowStartY1 = arrow.y1;
          arrowStartX2 = arrow.x2;
          arrowStartY2 = arrow.y2;
          // Save state before dragging
          this.saveArrowState();
          e.stopPropagation();
        };
        
        const onDrag = (e) => {
          if (!isDragging) return;
          const containerRect = container.getBoundingClientRect();
          const deltaX = (e.clientX - containerRect.left) - dragStartX;
          const deltaY = (e.clientY - containerRect.top) - dragStartY;
          arrow.x1 = arrowStartX1 + deltaX;
          arrow.y1 = arrowStartY1 + deltaY;
          arrow.x2 = arrowStartX2 + deltaX;
          arrow.y2 = arrowStartY2 + deltaY;
          this.updateArrowsOverlay();
        };
        
        const stopDrag = () => {
          isDragging = false;
          document.removeEventListener('mousemove', onDrag);
          document.removeEventListener('mouseup', stopDrag);
        };
        
        group.addEventListener('mousedown', (e) => {
          if (e.target.tagName === 'circle') {
            // Resize anchor clicked
            const anchor = e.target.getAttribute('data-anchor');
            const arrowId = parseInt(e.target.getAttribute('data-arrow-id'));
            const arrow = this.arrows.find(a => a.id === arrowId);
            if (!arrow) return;
            
            let isResizing = true;
            const containerRect = container.getBoundingClientRect();
            // Save state before resizing
            this.saveArrowState();
            
            const onResize = (e) => {
              if (!isResizing) return;
              const x = e.clientX - containerRect.left;
              const y = e.clientY - containerRect.top;
              if (anchor === 'start') {
                arrow.x1 = x;
                arrow.y1 = y;
              } else {
                arrow.x2 = x;
                arrow.y2 = y;
              }
              this.updateArrowsOverlay();
            };
            
            const stopResize = () => {
              isResizing = false;
              document.removeEventListener('mousemove', onResize);
              document.removeEventListener('mouseup', stopResize);
            };
            
            document.addEventListener('mousemove', onResize);
            document.addEventListener('mouseup', stopResize);
            e.stopPropagation();
          } else {
            // Arrow body clicked - drag
            startDrag(e);
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
          }
        });
      }
      
      svg.appendChild(group);
    });
  }

  async renderArrowsOnScreenshot() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get scale factors
        const containerRect = this.elements.screenshotContainer.getBoundingClientRect();
        const scaleX = img.width / containerRect.width;
        const scaleY = img.height / containerRect.height;
        
        const colorMap = {
          red: '#ef4444',
          blue: '#3b82f6',
          green: '#10b981',
          yellow: '#f59e0b',
          white: '#ffffff',
          black: '#000000'
        };
        
        // Draw freehand paths
        this.freehandPaths.forEach(path => {
          if (path.points.length < 2) return;
          
          const color = colorMap[path.color] || colorMap.red;
          ctx.strokeStyle = color;
          ctx.lineWidth = 3 * Math.min(scaleX, scaleY);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          
          const firstPoint = path.points[0];
          ctx.moveTo(firstPoint.x * scaleX, firstPoint.y * scaleY);
          
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x * scaleX, path.points[i].y * scaleY);
          }
          
          ctx.stroke();
        });
        
        // Draw arrows
        this.arrows.forEach(arrow => {
          const color = colorMap[arrow.color] || colorMap.red;
          
          const x1 = arrow.x1 * scaleX;
          const y1 = arrow.y1 * scaleY;
          const x2 = arrow.x2 * scaleX;
          const y2 = arrow.y2 * scaleY;
          
          // Draw arrow line
          ctx.strokeStyle = color;
          ctx.lineWidth = 3 * Math.min(scaleX, scaleY);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          
          // Draw arrow head
          const dx = x2 - x1;
          const dy = y2 - y1;
          const angle = Math.atan2(dy, dx);
          const headLength = 15 * Math.min(scaleX, scaleY);
          const headWidth = 10 * Math.min(scaleX, scaleY);
          
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - headLength * Math.cos(angle) + headWidth * Math.sin(angle),
            y2 - headLength * Math.sin(angle) - headWidth * Math.cos(angle)
          );
          ctx.lineTo(
            x2 - headLength * Math.cos(angle) - headWidth * Math.sin(angle),
            y2 - headLength * Math.sin(angle) + headWidth * Math.cos(angle)
          );
          ctx.closePath();
          ctx.fill();
        });
        
        // Draw text annotations
        this.texts.forEach(textAnnotation => {
          const color = colorMap[textAnnotation.color] || colorMap.red;
          const fontSize = 16 * Math.min(scaleX, scaleY);
          
          ctx.fillStyle = color;
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textBaseline = 'top';
          
          // Draw text background
          const metrics = ctx.measureText(textAnnotation.text);
          const padding = 4 * Math.min(scaleX, scaleY);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(
            textAnnotation.x * scaleX - padding,
            textAnnotation.y * scaleY - padding,
            metrics.width + padding * 2,
            fontSize + padding * 2
          );
          
          // Draw text
          ctx.fillStyle = color;
          ctx.fillText(
            textAnnotation.text,
            textAnnotation.x * scaleX,
            textAnnotation.y * scaleY
          );
        });
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create screenshot with arrows'));
          }
        }, 'image/png');
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(this.screenshotBlob);
    });
  }

  getAnnotationState() {
    return {
      arrows: JSON.parse(JSON.stringify(this.arrows)),
      texts: JSON.parse(JSON.stringify(this.texts)),
      freehandPaths: JSON.parse(JSON.stringify(this.freehandPaths))
    };
  }

  saveArrowState() {
    // Deep clone all annotations
    const state = this.getAnnotationState();
    
    // Remove any future history if we're in the middle of undo/redo
    if (this.arrowHistoryIndex < this.arrowHistory.length - 1) {
      this.arrowHistory = this.arrowHistory.slice(0, this.arrowHistoryIndex + 1);
    }
    
    // Add new state to history
    this.arrowHistory.push(state);
    this.arrowHistoryIndex = this.arrowHistory.length - 1;
    
    // Limit history size to prevent memory issues
    const maxHistory = 50;
    if (this.arrowHistory.length > maxHistory) {
      this.arrowHistory.shift();
      this.arrowHistoryIndex--;
    }
  }

  undo() {
    if (this.arrowHistoryIndex > 0) {
      this.arrowHistoryIndex--;
      const state = this.arrowHistory[this.arrowHistoryIndex];
      this.arrows = JSON.parse(JSON.stringify(state.arrows || []));
      this.texts = JSON.parse(JSON.stringify(state.texts || []));
      this.freehandPaths = JSON.parse(JSON.stringify(state.freehandPaths || []));
      this.updateArrowsOverlay();
      this.updateTextAnnotations();
      this.updateUndoRedoButtons();
    }
  }

  redo() {
    if (this.arrowHistoryIndex < this.arrowHistory.length - 1) {
      this.arrowHistoryIndex++;
      const state = this.arrowHistory[this.arrowHistoryIndex];
      this.arrows = JSON.parse(JSON.stringify(state.arrows || []));
      this.texts = JSON.parse(JSON.stringify(state.texts || []));
      this.freehandPaths = JSON.parse(JSON.stringify(state.freehandPaths || []));
      this.updateArrowsOverlay();
      this.updateTextAnnotations();
      this.updateUndoRedoButtons();
    }
  }

  clearAllAnnotations() {
    const totalCount = this.arrows.length + this.texts.length + this.freehandPaths.length;
    if (totalCount === 0) return;
    
    if (confirm('Are you sure you want to clear all annotations?')) {
      this.arrows = [];
      this.texts = [];
      this.freehandPaths = [];
      this.saveArrowState();
      this.updateArrowsOverlay();
      this.updateTextAnnotations();
      this.updateUndoRedoButtons();
    }
  }

  createTextAnnotation(x, y) {
    const textId = Date.now();
    const colorMap = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#f59e0b',
      white: '#ffffff',
      black: '#000000'
    };
    const color = colorMap[this.selectedColor] || colorMap.red;
    
    const textAnnotation = {
      id: textId,
      x: x,
      y: y,
      text: 'Text',
      color: this.selectedColor
    };
    
    this.texts.push(textAnnotation);
    this.saveArrowState();
    this.updateTextAnnotations();
    this.updateUndoRedoButtons();
    
    // Create editable text element
    const textDiv = document.createElement('div');
    textDiv.className = 'br-text-annotation';
    textDiv.setAttribute('data-text-id', textId);
    textDiv.style.position = 'absolute';
    textDiv.style.left = `${x}px`;
    textDiv.style.top = `${y}px`;
    textDiv.style.color = color;
    textDiv.style.fontSize = '16px';
    textDiv.style.fontWeight = 'bold';
    textDiv.style.cursor = 'text';
    textDiv.style.userSelect = 'text';
    textDiv.style.zIndex = '11';
    textDiv.style.padding = '4px 8px';
    textDiv.style.background = 'rgba(255, 255, 255, 0.8)';
    textDiv.style.borderRadius = '4px';
    textDiv.contentEditable = 'true';
    textDiv.textContent = 'Text';
    
    // Focus and select text for editing
    setTimeout(() => {
      textDiv.focus();
      const range = document.createRange();
      range.selectNodeContents(textDiv);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }, 10);
    
    // Update text on input
    textDiv.addEventListener('input', () => {
      const annotation = this.texts.find(t => t.id === textId);
      if (annotation) {
        annotation.text = textDiv.textContent;
        this.saveArrowState();
      }
    });
    
    // Remove on blur if empty
    textDiv.addEventListener('blur', () => {
      if (!textDiv.textContent.trim()) {
        this.texts = this.texts.filter(t => t.id !== textId);
        textDiv.remove();
        this.saveArrowState();
        this.updateUndoRedoButtons();
      }
    });
    
    // Make draggable
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let textStartX = 0;
    let textStartY = 0;
    
    textDiv.addEventListener('mousedown', (e) => {
      // Only start dragging if not clicking on the text itself (allow text selection)
      if (e.target === textDiv && window.getSelection().toString() === '') {
        isDragging = true;
        const containerRect = this.elements.screenshotContainer.getBoundingClientRect();
        dragStartX = e.clientX - containerRect.left;
        dragStartY = e.clientY - containerRect.top;
        textStartX = x;
        textStartY = y;
        e.preventDefault();
        e.stopPropagation();
      }
    });
    
    const handleMouseMove = (e) => {
      if (isDragging) {
        const containerRect = this.elements.screenshotContainer.getBoundingClientRect();
        const deltaX = (e.clientX - containerRect.left) - dragStartX;
        const deltaY = (e.clientY - containerRect.top) - dragStartY;
        const newX = textStartX + deltaX;
        const newY = textStartY + deltaY;
        textDiv.style.left = `${newX}px`;
        textDiv.style.top = `${newY}px`;
      }
    };
    
    const handleMouseUp = () => {
      if (isDragging) {
        const annotation = this.texts.find(t => t.id === textId);
        if (annotation) {
          annotation.x = parseFloat(textDiv.style.left);
          annotation.y = parseFloat(textDiv.style.top);
          this.saveArrowState();
        }
        isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    this.elements.screenshotContainer.appendChild(textDiv);
    this.currentText = textDiv;
  }

  updateTextAnnotations() {
    // Remove all existing text annotations
    const existingTexts = this.elements.screenshotContainer.querySelectorAll('.br-text-annotation');
    existingTexts.forEach(el => el.remove());
    
    // Recreate all text annotations
    this.texts.forEach(textAnnotation => {
      const colorMap = {
        red: '#ef4444',
        blue: '#3b82f6',
        green: '#10b981',
        yellow: '#f59e0b',
        white: '#ffffff',
        black: '#000000'
      };
      const color = colorMap[textAnnotation.color] || colorMap.red;
      
      const textDiv = document.createElement('div');
      textDiv.className = 'br-text-annotation';
      textDiv.setAttribute('data-text-id', textAnnotation.id);
      textDiv.style.position = 'absolute';
      textDiv.style.left = `${textAnnotation.x}px`;
      textDiv.style.top = `${textAnnotation.y}px`;
      textDiv.style.color = color;
      textDiv.style.fontSize = '16px';
      textDiv.style.fontWeight = 'bold';
      textDiv.style.cursor = 'text';
      textDiv.style.userSelect = 'text';
      textDiv.style.zIndex = '11';
      textDiv.style.padding = '4px 8px';
      textDiv.style.background = 'rgba(255, 255, 255, 0.8)';
      textDiv.style.borderRadius = '4px';
      textDiv.contentEditable = 'true';
      textDiv.textContent = textAnnotation.text;
      
      // Update text on input
      textDiv.addEventListener('input', () => {
        const annotation = this.texts.find(t => t.id === textAnnotation.id);
        if (annotation) {
          annotation.text = textDiv.textContent;
          this.saveArrowState();
        }
      });
      
      // Remove on blur if empty
      textDiv.addEventListener('blur', () => {
        if (!textDiv.textContent.trim()) {
          this.texts = this.texts.filter(t => t.id !== textAnnotation.id);
          textDiv.remove();
          this.saveArrowState();
          this.updateUndoRedoButtons();
        }
      });
      
      // Make draggable
      let isDragging = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let textStartX = textAnnotation.x;
      let textStartY = textAnnotation.y;
      
      textDiv.addEventListener('mousedown', (e) => {
        // Only start dragging if not clicking on the text itself (allow text selection)
        if (e.target === textDiv && window.getSelection().toString() === '') {
          isDragging = true;
          const containerRect = this.elements.screenshotContainer.getBoundingClientRect();
          dragStartX = e.clientX - containerRect.left;
          dragStartY = e.clientY - containerRect.top;
          textStartX = textAnnotation.x;
          textStartY = textAnnotation.y;
          e.preventDefault();
          e.stopPropagation();
        }
      });
      
      const handleMouseMove = (e) => {
        if (isDragging) {
          const containerRect = this.elements.screenshotContainer.getBoundingClientRect();
          const deltaX = (e.clientX - containerRect.left) - dragStartX;
          const deltaY = (e.clientY - containerRect.top) - dragStartY;
          const newX = textStartX + deltaX;
          const newY = textStartY + deltaY;
          textDiv.style.left = `${newX}px`;
          textDiv.style.top = `${newY}px`;
        }
      };
      
      const handleMouseUp = () => {
        if (isDragging) {
          const annotation = this.texts.find(t => t.id === textAnnotation.id);
          if (annotation) {
            annotation.x = parseFloat(textDiv.style.left);
            annotation.y = parseFloat(textDiv.style.top);
            this.saveArrowState();
          }
          isDragging = false;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      this.elements.screenshotContainer.appendChild(textDiv);
    });
  }

  updateUndoRedoButtons() {
    if (this.elements.undoBtn) {
      this.elements.undoBtn.disabled = this.arrowHistoryIndex <= 0;
    }
    if (this.elements.redoBtn) {
      this.elements.redoBtn.disabled = this.arrowHistoryIndex >= this.arrowHistory.length - 1;
    }
  }

  destroy() {
    this.logger.stopIntercepting();
    this.networkMonitor.stopMonitoring();
    
    const customStyles = document.getElementById('br-custom-styles');
    if (customStyles) {
      customStyles.remove();
    }
    
    if (this.elements.triggerBtn) {
      this.elements.triggerBtn.remove();
    }
    if (this.elements.widget) {
      this.elements.widget.remove();
    }
  }
}

const instance = new BugReporter();

export default instance;
