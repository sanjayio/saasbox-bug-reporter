import html2canvas from 'html2canvas';

export async function captureScreenshot() {
  try {
    const widgetElements = document.querySelectorAll('.br-widget, .br-trigger-btn');
    widgetElements.forEach(el => {
      if (el) el.style.display = 'none';
    });

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

    widgetElements.forEach(el => {
      if (el) el.style.display = '';
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
  } catch (error) {
    const widgetElements = document.querySelectorAll('.br-widget, .br-trigger-btn');
    widgetElements.forEach(el => {
      if (el) el.style.display = '';
    });
    throw error;
  }
}

export async function captureScreenshotArea(rect) {
  try {
    const widgetElements = document.querySelectorAll('.br-widget, .br-trigger-btn');
    widgetElements.forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Capture the full viewport
    // With scrollY: -window.scrollY, html2canvas captures the viewport
    // The canvas dimensions should match window.innerWidth/innerHeight
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

    widgetElements.forEach(el => {
      if (el) el.style.display = '';
    });

    // Calculate scale factors
    // The canvas might be scaled by devicePixelRatio or other factors
    const scaleX = canvas.width / window.innerWidth;
    const scaleY = canvas.height / window.innerHeight;
    
    // Convert viewport coordinates to canvas coordinates
    // rect.x and rect.y are viewport coordinates (clientX, clientY)
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
          reject(new Error('Failed to create screenshot blob'));
        }
      }, 'image/png');
    });
  } catch (error) {
    const widgetElements = document.querySelectorAll('.br-widget, .br-trigger-btn');
    widgetElements.forEach(el => {
      if (el) el.style.display = '';
    });
    throw error;
  }
}
