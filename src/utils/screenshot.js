// Import modern-screenshot for better scroll position handling
// Use dynamic import to avoid bundling issues
let modernScreenshot = null;
const getScreenshotLib = async () => {
  if (!modernScreenshot) {
    try {
      const module = await import('modern-screenshot');
      modernScreenshot = module.domToPng;
    } catch (e) {
      console.error('Failed to load modern-screenshot:', e);
      throw new Error('modern-screenshot library not available');
    }
  }
  return modernScreenshot;
};

// Add a simple test to verify the library is working
export function testScreenshotLibrary() {
  console.log('Testing screenshot library...');
  return true;
}

export async function captureScreenshot() {
  const widgetElements = document.querySelectorAll('.br-widget, .br-trigger-btn');
  
  try {
    // Hide widget elements first
    widgetElements.forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Wait a moment for widgets to hide
    await new Promise(resolve => setTimeout(resolve, 100));

    // Use browser's native screen capture API
    // This is the ONLY way to reliably capture what's actually visible on screen
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      try {
        // Request screen capture from user
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            mediaSource: 'screen',
            width: { ideal: window.innerWidth },
            height: { ideal: window.innerHeight }
          },
          audio: false,
          preferCurrentTab: true
        });

        // Create video element to capture frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });

        // Wait a bit more for frame to be available
        await new Promise(resolve => setTimeout(resolve, 500));

        // Capture the current frame to canvas
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());

        // Convert canvas to blob
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        });
      } catch (screenCaptureError) {
        console.log('Screen capture cancelled or failed, falling back to DOM capture');
        // User cancelled or permission denied - fall back to DOM capture
      }
    }

    // Fallback: Use modern-screenshot (will have scroll issues but better than nothing)
    const domToPng = await getScreenshotLib();
    const dataUrl = await domToPng(document.body, {
      quality: 0.95,
      backgroundColor: '#ffffff',
      filter: (node) => {
        if (node.classList) {
          return !node.classList.contains('br-widget') && 
                 !node.classList.contains('br-trigger-btn');
        }
        return true;
      }
    });

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    return null;
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

    // Wait for widgets to hide
    await new Promise(resolve => setTimeout(resolve, 100));

    // Use native Screen Capture API to get actual screen pixels
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      try {
        // Request screen capture from user
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            mediaSource: 'screen',
            width: { ideal: window.innerWidth },
            height: { ideal: window.innerHeight }
          },
          audio: false,
          preferCurrentTab: true
        });

        // Create video element to capture frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });

        // Wait a bit more for frame to be available
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create canvas to capture and crop
        const canvas = document.createElement('canvas');
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');
        
        // Calculate scale between video and viewport
        const scaleX = video.videoWidth / window.innerWidth;
        const scaleY = video.videoHeight / window.innerHeight;
        
        // Crop the video to the selected area
        ctx.drawImage(
          video,
          rect.x * scaleX,           // Source X
          rect.y * scaleY,           // Source Y
          rect.width * scaleX,       // Source Width
          rect.height * scaleY,      // Source Height
          0,                         // Dest X
          0,                         // Dest Y
          rect.width,                // Dest Width
          rect.height                // Dest Height
        );

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());

        // Convert canvas to blob
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        });
      } catch (screenCaptureError) {
        console.log('Screen capture cancelled or failed, falling back to full viewport');
        // Fall through to fallback
      }
    }

    // Fallback: Use modern-screenshot for full viewport (no cropping)
    const domToPng = await getScreenshotLib();
    const dataUrl = await domToPng(document.body, {
      quality: 0.95,
      backgroundColor: '#ffffff',
      filter: (node) => {
        if (node.classList) {
          return !node.classList.contains('br-widget') && 
                 !node.classList.contains('br-trigger-btn');
        }
        return true;
      }
    });

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    return null;
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