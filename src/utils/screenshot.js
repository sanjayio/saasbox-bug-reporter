import html2canvas from 'html2canvas';

/**
 * Gets a unique selector for an element to match it between documents
 */
function getElementSelector(el) {
  if (el.id) {
    return `#${el.id}`;
  }
  
  let path = [];
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    let sibling = el;
    let nth = 1;
    while (sibling.previousElementSibling) {
      sibling = sibling.previousElementSibling;
      if (sibling.nodeName === el.nodeName) {
        nth++;
      }
    }
    if (nth > 1) {
      selector += `:nth-of-type(${nth})`;
    }
    
    path.unshift(selector);
    el = el.parentElement;
    
    // Limit depth to avoid very long selectors
    if (path.length > 10) break;
  }
  
  return path.join(' > ');
}

/**
 * Converts unsupported CSS color functions (like lab()) to rgb/hex
 * by using getComputedStyle to get the browser's computed color value
 */
function convertUnsupportedColors(clonedDoc) {
  try {
    const clonedElements = clonedDoc.querySelectorAll('*');
    
    // Process each cloned element
    clonedElements.forEach((clonedEl) => {
      try {
        // Try to find the corresponding element in the original document
        let originalEl = null;
        
        // First try by ID
        if (clonedEl.id) {
          originalEl = document.getElementById(clonedEl.id);
        }
        
        // If not found, try by selector
        if (!originalEl) {
          try {
            const selector = getElementSelector(clonedEl);
            if (selector) {
              originalEl = document.querySelector(selector);
            }
          } catch (e) {
            // Selector might be invalid, continue
          }
        }
        
        if (!originalEl) return;
        
        const computedStyle = window.getComputedStyle(originalEl);
        
        // Convert color properties that might contain lab() or other unsupported functions
        const colorProperties = [
          'color',
          'backgroundColor',
          'borderColor',
          'borderTopColor',
          'borderRightColor',
          'borderBottomColor',
          'borderLeftColor',
          'outlineColor',
          'textDecorationColor',
          'columnRuleColor'
        ];
        
        colorProperties.forEach(prop => {
          try {
            const computedColor = computedStyle[prop];
            if (computedColor && computedColor !== 'transparent' && computedColor !== 'rgba(0, 0, 0, 0)') {
              // Apply the computed color (browser has already converted lab() to rgb)
              clonedEl.style[prop] = computedColor;
            }
          } catch (e) {
            // Skip this property if it fails
          }
        });
        
        // Handle background properties that might contain lab() colors
        try {
          const bgColor = computedStyle.backgroundColor;
          if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
            clonedEl.style.backgroundColor = bgColor;
          }
          
          const bgImage = computedStyle.backgroundImage;
          if (bgImage && bgImage !== 'none') {
            // For gradients with lab() colors, the browser computes them to rgb
            // So we can use the computed background-image
            clonedEl.style.backgroundImage = bgImage;
          }
        } catch (e) {
          // Skip background processing if it fails
        }
      } catch (e) {
        // Silently continue if we can't process an element
      }
    });
    
    // Process style attributes that might contain lab() colors
    clonedElements.forEach((clonedEl) => {
      if (clonedEl.hasAttribute('style')) {
        const styleAttr = clonedEl.getAttribute('style');
        if (styleAttr && (styleAttr.includes('lab(') || styleAttr.includes('lch('))) {
          try {
            // Try to find original element
            let originalEl = null;
            if (clonedEl.id) {
              originalEl = document.getElementById(clonedEl.id);
            }
            if (!originalEl) {
              try {
                const selector = getElementSelector(clonedEl);
                if (selector) {
                  originalEl = document.querySelector(selector);
                }
              } catch (e) {
                // Continue without original element
              }
            }
            
            if (originalEl) {
              const computedStyle = window.getComputedStyle(originalEl);
              // Replace style attribute with computed values for color properties
              const styleObj = {};
              styleAttr.split(';').forEach(declaration => {
                const colonIndex = declaration.indexOf(':');
                if (colonIndex > 0) {
                  const prop = declaration.substring(0, colonIndex).trim();
                  const value = declaration.substring(colonIndex + 1).trim();
                  if (prop && value && (value.includes('lab(') || value.includes('lch('))) {
                    const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    try {
                      const computedValue = computedStyle[camelProp];
                      if (computedValue) {
                        styleObj[prop] = computedValue;
                      }
                    } catch (e) {
                      // Keep original value if computed fails
                      styleObj[prop] = value;
                    }
                  } else if (prop && value) {
                    styleObj[prop] = value;
                  }
                }
              });
              
              // Rebuild style attribute
              const newStyle = Object.entries(styleObj)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ');
              clonedEl.setAttribute('style', newStyle);
            } else {
              // If we can't find the original element, remove lab() colors from style
              const cleanedStyle = styleAttr
                .replace(/lab\([^)]+\)/g, 'rgb(128, 128, 128)') // Fallback to gray
                .replace(/lch\([^)]+\)/g, 'rgb(128, 128, 128)');
              clonedEl.setAttribute('style', cleanedStyle);
            }
          } catch (e) {
            // If conversion fails, try to clean the style attribute
            try {
              const cleanedStyle = styleAttr
                .replace(/lab\([^)]+\)/g, 'rgb(128, 128, 128)')
                .replace(/lch\([^)]+\)/g, 'rgb(128, 128, 128)');
              clonedEl.setAttribute('style', cleanedStyle);
            } catch (e2) {
              // Last resort: remove the style attribute
              clonedEl.removeAttribute('style');
            }
          }
        }
      }
    });
  } catch (e) {
    // If the entire conversion fails, log a warning but don't throw
    console.warn('Failed to convert unsupported colors:', e);
  }
}

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
      scrollX: -window.scrollX,
      onclone: (clonedDoc) => {
        // Convert unsupported color functions before html2canvas processes them
        convertUnsupportedColors(clonedDoc);
      }
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
      scale: 1,
      onclone: (clonedDoc) => {
        // Convert unsupported color functions before html2canvas processes them
        convertUnsupportedColors(clonedDoc);
      }
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
