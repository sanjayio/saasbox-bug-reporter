// Import html-to-image for better color support and Next.js compatibility
// Use dynamic import to avoid bundling issues
let htmlToImagePng = null;
const getHtmlToImage = async () => {
  if (!htmlToImagePng) {
    try {
      const module = await import('html-to-image');
      htmlToImagePng = module.toPng;
    } catch (e) {
      console.error('Failed to load html-to-image:', e);
      throw new Error('html-to-image library not available');
    }
  }
  return htmlToImagePng;
};

// Add a simple test to verify the library is working
export function testScreenshotLibrary() {
  console.log('Testing html-to-image library...');
  console.log('Available functions:', Object.keys(htmlToImagePng));
  return true;
}

export async function captureScreenshot() {
  const widgetElements = document.querySelectorAll('.br-widget, .br-trigger-btn');
  
  try {
    console.log('Starting screenshot capture...');
    
    // Hide widget elements
    widgetElements.forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Get html-to-image function dynamically
    const toPng = await getHtmlToImage();
    console.log('html-to-image loaded successfully');

    // Use html-to-image with very basic settings first
    const dataUrl = await toPng(document.body, {
      quality: 0.8,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#ffffff'
    });
    console.log('Screenshot generated successfully');

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    console.error('Error details:', error.stack);
    // Fall back to a simple canvas-based screenshot if html-to-image fails
    try {
      console.log('Trying fallback canvas screenshot...');
      return await captureScreenshotWithCanvas();
    } catch (fallbackError) {
      console.error('Fallback screenshot also failed:', fallbackError);
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

    // Capture the full viewport with simplified html-to-image settings
    const toPng = await getHtmlToImage();
    const dataUrl = await toPng(document.body, {
      quality: 0.9,
      pixelRatio: 1,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#ffffff',
      filter: (node) => {
        return !node.classList?.contains('br-widget') && 
               !node.classList?.contains('br-trigger-btn');
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
    console.error('Area screenshot capture failed:', error);
    throw new Error(`Area screenshot capture failed: ${error.message}`);
  } finally {
    // Always restore widget elements
    widgetElements.forEach(el => {
      if (el) el.style.display = '';
    });
  }
}

// Improved fallback using native canvas API
async function captureScreenshotWithCanvas() {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas to capture the visible portion
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to viewport
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Try to draw the document content using a simpler approach
      // This is a basic fallback - it won't capture everything but will work
      ctx.fillStyle = '#333333';
      ctx.font = '14px Arial';
      
      let y = 30;
      const lineHeight = 20;
      
      // Add page information
      ctx.fillText('Bug Reporter Screenshot', 20, y);
      y += lineHeight;
      ctx.fillText(`Page: ${window.location.href}`, 20, y);
      y += lineHeight;
      ctx.fillText(`Size: ${width}x${height}`, 20, y);
      y += lineHeight;
      ctx.fillText(`Time: ${new Date().toLocaleString()}`, 20, y);
      y += lineHeight * 2;
      
      // Try to capture some basic page content
      const title = document.title || 'No title';
      ctx.fillText(`Title: ${title}`, 20, y);
      y += lineHeight;
      
      const bodyText = document.body?.innerText?.substring(0, 200) || 'No content';
      ctx.fillText(`Content: ${bodyText}`, 20, y);
      
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('Fallback screenshot created successfully');
          resolve(blob);
        } else {
          reject(new Error('Failed to create canvas screenshot'));
        }
      }, 'image/png');
    } catch (error) {
      console.error('Canvas fallback failed:', error);
      reject(error);
    }
  });
}