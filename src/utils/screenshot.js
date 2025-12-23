// Import html-to-image for better color support and Next.js compatibility
import { toPng as htmlToImagePng } from 'html-to-image';

// Fallback to html2canvas-pro if html-to-image fails
let html2canvasFallback = null;
const getHtml2CanvasFallback = async () => {
  if (!html2canvasFallback) {
    try {
      const module = await import('html2canvas-pro');
      html2canvasFallback = module.default;
    } catch (e) {
      throw new Error('Neither html-to-image nor html2canvas-pro is available');
    }
  }
  return html2canvasFallback;
};

export async function captureScreenshot() {
  const widgetElements = document.querySelectorAll('.br-widget, .br-trigger-btn');
  
  try {
    // Hide widget elements
    widgetElements.forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Try html-to-image first (better color support)
    const dataUrl = await htmlToImagePng(document.body, {
      quality: 1,
      pixelRatio: window.devicePixelRatio || 1,
      width: window.innerWidth,
      height: window.innerHeight,
      style: {
        transform: 'translateY(0)',
        transformOrigin: 'top left'
      },
      filter: (node) => {
        // Filter out problematic nodes
        return node.tagName !== 'IMG' || !node.src.startsWith('blob:');
      }
    });

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.warn('html-to-image failed, trying html2canvas-pro fallback:', error);
    
    try {
      // Fallback to html2canvas-pro
      const html2canvas = await getHtml2CanvasFallback();
      
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX
      });

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create screenshot blob'));
          }
        }, 'image/png');
      });
    } catch (fallbackError) {
      console.error('Both screenshot methods failed:', fallbackError);
      throw new Error(`Screenshot capture failed: ${error.message}`);
    }
  } finally {
    // Always restore widget elements
    widgetElements.forEach(el => {
      if (el) el.style.display = '';
    });
  }
}

export async function captureScreenshotArea(rect) {
  const widgetElements = document.querySelectorAll('.br-widget, .br-trigger-btn');
  
  try {
    // Hide widget elements
    widgetElements.forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Try html-to-image first
    const dataUrl = await htmlToImagePng(document.body, {
      quality: 1,
      pixelRatio: window.devicePixelRatio || 1,
      width: window.innerWidth,
      height: window.innerHeight,
      style: {
        transform: 'translateY(0)',
        transformOrigin: 'top left'
      },
      filter: (node) => {
        // Filter out problematic nodes
        return node.tagName !== 'IMG' || !node.src.startsWith('blob:');
      }
    });

    // Create an image to work with the captured data
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Create a canvas for cropping
          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = rect.width;
          croppedCanvas.height = rect.height;
          const ctx = croppedCanvas.getContext('2d');
          
          // Calculate scale factors
          const scaleX = img.width / window.innerWidth;
          const scaleY = img.height / window.innerHeight;
          
          // Convert viewport coordinates to image coordinates
          const sourceX = Math.round(rect.x * scaleX);
          const sourceY = Math.round(rect.y * scaleY);
          const sourceWidth = Math.round(rect.width * scaleX);
          const sourceHeight = Math.round(rect.height * scaleY);
          
          // Ensure coordinates are within image bounds
          const clampedX = Math.max(0, Math.min(sourceX, img.width));
          const clampedY = Math.max(0, Math.min(sourceY, img.height));
          const clampedWidth = Math.min(sourceWidth, img.width - clampedX);
          const clampedHeight = Math.min(sourceHeight, img.height - clampedY);
          
          // Draw the selected area
          ctx.drawImage(
            img,
            clampedX, clampedY, clampedWidth, clampedHeight,
            0, 0, rect.width, rect.height
          );

          // Convert to blob
          croppedCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create cropped screenshot blob'));
            }
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load captured image'));
      };
      
      img.src = dataUrl;
    });
  } catch (error) {
    console.warn('html-to-image area capture failed, trying html2canvas-pro fallback:', error);
    
    try {
      // Fallback to html2canvas-pro for area capture
      const html2canvas = await getHtml2CanvasFallback();
      
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        scale: 1
      });

      // Calculate scale factors
      const scaleX = canvas.width / window.innerWidth;
      const scaleY = canvas.height / window.innerHeight;
      
      // Convert viewport coordinates to canvas coordinates
      const sourceX = Math.round(rect.x * scaleX);
      const sourceY = Math.round(rect.y * scaleY);
      const sourceWidth = Math.round(rect.width * scaleX);
      const sourceHeight = Math.round(rect.height * scaleY);
      
      // Ensure coordinates are within canvas bounds
      const clampedX = Math.max(0, Math.min(sourceX, canvas.width));
      const clampedY = Math.max(0, Math.min(sourceY, canvas.height));
      const clampedWidth = Math.min(sourceWidth, canvas.width - clampedX);
      const clampedHeight = Math.min(sourceHeight, canvas.height - clampedY);
      
      // Create cropped canvas with exact selection dimensions
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = rect.width;
      croppedCanvas.height = rect.height;
      const ctx = croppedCanvas.getContext('2d');
      
      // Draw the selected area, scaling it to match the exact selection size
      ctx.drawImage(
        canvas,
        clampedX, clampedY, clampedWidth, clampedHeight,
        0, 0, rect.width, rect.height
      );

      return new Promise((resolve, reject) => {
        croppedCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create cropped screenshot blob'));
          }
        }, 'image/png');
      });
    } catch (fallbackError) {
      console.error('Both area capture methods failed:', fallbackError);
      throw new Error(`Area screenshot capture failed: ${error.message}`);
    }
  } finally {
    // Always restore widget elements
    widgetElements.forEach(el => {
      if (el) el.style.display = '';
    });
  }
}
