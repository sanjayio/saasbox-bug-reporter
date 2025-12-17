import './styles.css';
import ConsoleLogger from './utils/logger';
import NetworkMonitor from './utils/network';
import { getSystemInfo } from './utils/system';
import { captureScreenshot } from './utils/screenshot';

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
      modalCancelText: 'Cancel'
    };
    this.logger = new ConsoleLogger(50);
    this.networkMonitor = new NetworkMonitor(20);
    this.screenshotBlob = null;
    this.isOpen = false;
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
      <div class="br-overlay"></div>
      <div class="br-modal">
        <div class="br-header">
          <h2>${this.config.modalTitle}</h2>
          <button class="br-close-btn">×</button>
        </div>
        <div class="br-body">
          <div class="br-screenshot-preview" style="display: none;">
            <img src="" alt="Screenshot preview" />
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
      overlay: widget.querySelector('.br-overlay'),
      closeBtn: widget.querySelector('.br-close-btn'),
      cancelBtn: widget.querySelector('.br-btn-cancel'),
      submitBtn: widget.querySelector('.br-btn-submit'),
      description: widget.querySelector('#br-description'),
      screenshotPreview: widget.querySelector('.br-screenshot-preview'),
      screenshotImg: widget.querySelector('.br-screenshot-preview img'),
      body: widget.querySelector('.br-body')
    };
  }

  attachEventListeners() {
    this.elements.triggerBtn.addEventListener('click', () => this.open());
    this.elements.overlay.addEventListener('click', () => this.close());
    this.elements.closeBtn.addEventListener('click', () => this.close());
    this.elements.cancelBtn.addEventListener('click', () => this.close());
    this.elements.submitBtn.addEventListener('click', () => this.submit());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  async open() {
    this.isOpen = true;
    this.elements.widget.classList.add('br-active');
    this.elements.description.value = '';
    this.elements.description.focus();

    this.showMessage('Capturing screenshot...', 'info');

    try {
      this.screenshotBlob = await captureScreenshot();
      const url = URL.createObjectURL(this.screenshotBlob);
      this.elements.screenshotImg.src = url;
      this.elements.screenshotPreview.style.display = 'block';
      this.clearMessages();
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      this.showMessage('Failed to capture screenshot, but you can still report the bug.', 'error');
      this.screenshotBlob = null;
    }
  }

  close() {
    this.isOpen = false;
    this.elements.widget.classList.remove('br-active');
    this.clearMessages();
    
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
      const formData = new FormData();
      
      formData.append('description', description);
      
      if (this.config.saasBoxKey) {
        formData.append('saasBoxKey', this.config.saasBoxKey);
      }
      
      if (this.config.saasBoxSecret) {
        formData.append('saasBoxSecret', this.config.saasBoxSecret);
      }
      
      if (this.screenshotBlob) {
        formData.append('screenshot', this.screenshotBlob, 'screenshot.png');
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
