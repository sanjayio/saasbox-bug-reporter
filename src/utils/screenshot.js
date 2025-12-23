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
 * Converts lab() and lch() color functions to rgb by replacing them with a fallback
 * This is a simple regex-based approach for stylesheet text
 */
function convertColorFunctionsInText(text) {
  if (!text) return text;
  
  // Replace lab() and lch() functions with a fallback rgb color
  // We use a medium gray as fallback since we can't easily convert without a color library
  return text
    .replace(/lab\([^)]+\)/gi, 'rgb(128, 128, 128)')
    .replace(/lch\([^)]+\)/gi, 'rgb(128, 128, 128)');
}

/**
 * Attempts to convert lab()/lch() colors in stylesheet text
 * This is a best-effort approach since we can't always access stylesheet text
 */
function convertStylesheetColors() {
  const overrideStyle = document.createElement('style');
  overrideStyle.setAttribute('data-br-color-override', 'true');
  overrideStyle.setAttribute('type', 'text/css');
  
  const rules = [];
  
  try {
    // Process all accessible stylesheets
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i];
        if (!sheet.cssRules && !sheet.rules) continue;
        
        const cssRules = sheet.cssRules || sheet.rules;
        for (let j = 0; j < cssRules.length; j++) {
          try {
            const rule = cssRules[j];
            if (rule.style && rule.selectorText) {
              // Get computed colors for elements matching this selector
              try {
                const testElements = document.querySelectorAll(rule.selectorText);
                if (testElements.length > 0) {
                  const firstEl = testElements[0];
                  const computed = window.getComputedStyle(firstEl);
                  
                  const colorProps = [
                    { css: 'color', js: 'color' },
                    { css: 'background-color', js: 'backgroundColor' },
                    { css: 'border-color', js: 'borderColor' }
                  ];
                  
                  let ruleParts = [];
                  colorProps.forEach(({ css, js }) => {
                    const value = computed[js];
                    if (value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') {
                      if (!value.includes('lab(') && !value.includes('lch(')) {
                        ruleParts.push(`${css}: ${value} !important;`);
                      }
                    }
                  });
                  
                  if (ruleParts.length > 0) {
                    rules.push(`${rule.selectorText} { ${ruleParts.join(' ')} }`);
                  }
                }
              } catch (e) {
                // Skip if selector is invalid
              }
            }
          } catch (e) {
            // Skip rules that can't be accessed (e.g., cross-origin)
            continue;
          }
        }
      } catch (e) {
        // Skip stylesheets that can't be accessed
        continue;
      }
    }
  } catch (e) {
    console.warn('Failed to process stylesheets:', e);
  }
  
  // Add a global override that forces computed colors
  // This uses a very high specificity to override lab() colors
  const globalOverride = `
    html * {
      color: inherit !important;
      background-color: inherit !important;
      border-color: inherit !important;
    }
  `;
  
  overrideStyle.textContent = globalOverride + rules.join('\n');
  document.head.appendChild(overrideStyle);
  
  return overrideStyle;
}

/**
 * Removes the color override stylesheet
 */
function removeColorOverrideStylesheet(overrideStyle) {
  try {
    if (overrideStyle && overrideStyle.parentNode) {
      overrideStyle.parentNode.removeChild(overrideStyle);
    }
  } catch (e) {
    // Ignore errors
  }
}

/**
 * Wrapper for html2canvas that handles lab() color errors gracefully
 */
async function safeHtml2canvas(element, options) {
  try {
    return await html2canvas(element, options);
  } catch (error) {
    // If it's a lab()/lch() color error, provide helpful message
    if (error.message && (error.message.includes('lab') || error.message.includes('lch') || error.message.includes('color function'))) {
      const enhancedError = new Error(
        'Screenshot capture failed: The page uses unsupported CSS color functions (lab/lch). ' +
        'html2canvas cannot parse these modern color formats. ' +
        'Please use standard color formats (rgb, hex, hsl) in your CSS, or consider using a CSS preprocessor to convert lab() colors to rgb during build time.'
      );
      enhancedError.originalError = error;
      throw enhancedError;
    }
    throw error;
  }
}

/**
 * Converts unsupported CSS color functions (like lab()) to rgb/hex
 * by processing stylesheets and inline styles
 */
function convertUnsupportedColors(clonedDoc) {
  try {
    // Process all stylesheets in the cloned document
    const styleSheets = clonedDoc.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const sheet = styleSheets[i];
        if (!sheet.cssRules && !sheet.rules) continue;
        
        const rules = sheet.cssRules || sheet.rules;
        for (let j = 0; j < rules.length; j++) {
          try {
            const rule = rules[j];
            if (rule.style) {
              // Process each style property
              for (let k = 0; k < rule.style.length; k++) {
                const prop = rule.style[k];
                const value = rule.style.getPropertyValue(prop);
                
                if (value && (value.includes('lab(') || value.includes('lch('))) {
                  // Try to get computed value from original document
                  try {
                    // Create a temporary element to get computed style
                    const tempEl = document.createElement('div');
                    tempEl.style.cssText = `${prop}: ${value}`;
                    document.body.appendChild(tempEl);
                    const computed = window.getComputedStyle(tempEl)[prop];
                    document.body.removeChild(tempEl);
                    
                    if (computed && !computed.includes('lab(') && !computed.includes('lch(')) {
                      rule.style.setProperty(prop, computed, rule.style.getPropertyPriority(prop));
                    } else {
                      // Fallback to gray
                      rule.style.setProperty(prop, 'rgb(128, 128, 128)', rule.style.getPropertyPriority(prop));
                    }
                  } catch (e) {
                    // Fallback to gray if computation fails
                    rule.style.setProperty(prop, 'rgb(128, 128, 128)', rule.style.getPropertyPriority(prop));
                  }
                }
              }
            }
          } catch (e) {
            // Skip rules that can't be accessed (e.g., cross-origin)
            continue;
          }
        }
      } catch (e) {
        // Skip stylesheets that can't be accessed
        continue;
      }
    }
    
    // Process inline styles in style tags
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach(styleTag => {
      try {
        if (styleTag.textContent && (styleTag.textContent.includes('lab(') || styleTag.textContent.includes('lch('))) {
          // Process the CSS text
          let cssText = styleTag.textContent;
          
          // Replace lab() and lch() with computed values where possible
          // For now, use a simple replacement
          cssText = convertColorFunctionsInText(cssText);
          styleTag.textContent = cssText;
        }
      } catch (e) {
        // Skip if we can't process
      }
    });
    
    // Process all elements and their computed styles
    const clonedElements = clonedDoc.querySelectorAll('*');
    
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
        
        if (originalEl) {
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
          
          // Handle background properties
          try {
            const bgColor = computedStyle.backgroundColor;
            if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
              clonedEl.style.backgroundColor = bgColor;
            }
            
            const bgImage = computedStyle.backgroundImage;
            if (bgImage && bgImage !== 'none') {
              clonedEl.style.backgroundImage = bgImage;
            }
          } catch (e) {
            // Skip background processing if it fails
          }
        }
      } catch (e) {
        // Silently continue if we can't process an element
      }
      
      // Process inline style attributes
      if (clonedEl.hasAttribute('style')) {
        const styleAttr = clonedEl.getAttribute('style');
        if (styleAttr && (styleAttr.includes('lab(') || styleAttr.includes('lch('))) {
          // Clean the style attribute
          const cleanedStyle = convertColorFunctionsInText(styleAttr);
          clonedEl.setAttribute('style', cleanedStyle);
        }
      }
    });
  } catch (e) {
    // If the entire conversion fails, log a warning but don't throw
    console.warn('Failed to convert unsupported colors:', e);
  }
}

export async function captureScreenshot() {
  const widgetElements = document.querySelectorAll('.br-widget, .br-trigger-btn');
  widgetElements.forEach(el => {
    if (el) el.style.display = 'none';
  });

  // Create override stylesheet to replace lab() colors
  const overrideStyle = convertStylesheetColors();
  
  // Wait a bit for styles to apply
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    const canvas = await safeHtml2canvas(document.body, {
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
        // Convert unsupported color functions in cloned document
        convertUnsupportedColors(clonedDoc);
      }
    });

    widgetElements.forEach(el => {
      if (el) el.style.display = '';
    });
    
    // Remove override stylesheet
    removeColorOverrideStylesheet(overrideStyle);

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
    widgetElements.forEach(el => {
      if (el) el.style.display = '';
    });
    
    // Remove override stylesheet even on error
    removeColorOverrideStylesheet(overrideStyle);
    
    // If error is related to lab() color parsing, try a fallback approach
    if (error.message && (error.message.includes('lab') || error.message.includes('lch'))) {
      console.warn('Screenshot capture failed due to unsupported color functions. The page uses lab()/lch() colors which html2canvas cannot parse. Consider using standard color formats (rgb, hex, hsl) for better compatibility.');
      throw new Error('Screenshot capture failed: The page uses unsupported CSS color functions (lab/lch). Please use standard color formats (rgb, hex, hsl) for better compatibility.');
    }
    
    throw error;
  }
}

export async function captureScreenshotArea(rect) {
  const widgetElements = document.querySelectorAll('.br-widget, .br-trigger-btn');
  widgetElements.forEach(el => {
    if (el) el.style.display = 'none';
  });

  // Create override stylesheet to replace lab() colors
  const overrideStyle = convertStylesheetColors();
  
  // Wait a bit for styles to apply
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    // Capture the full viewport
    // With scrollY: -window.scrollY, html2canvas captures the viewport
    // The canvas dimensions should match window.innerWidth/innerHeight
    const canvas = await safeHtml2canvas(document.body, {
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
        // Convert unsupported color functions in cloned document
        convertUnsupportedColors(clonedDoc);
      }
    });

    widgetElements.forEach(el => {
      if (el) el.style.display = '';
    });
    
    // Remove override stylesheet
    removeColorOverrideStylesheet(overrideStyle);

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
    widgetElements.forEach(el => {
      if (el) el.style.display = '';
    });
    
    // Remove override stylesheet even on error
    removeColorOverrideStylesheet(overrideStyle);
    
    // If error is related to lab() color parsing, provide a more helpful error
    if (error.message && (error.message.includes('lab') || error.message.includes('lch'))) {
      console.warn('Screenshot capture failed due to unsupported color functions. The page uses lab()/lch() colors which html2canvas cannot parse. Consider using standard color formats (rgb, hex, hsl) for better compatibility.');
      throw new Error('Screenshot capture failed: The page uses unsupported CSS color functions (lab/lch). Please use standard color formats (rgb, hex, hsl) for better compatibility.');
    }
    
    throw error;
  }
}
