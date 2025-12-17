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
