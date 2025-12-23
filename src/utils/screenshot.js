import html2canvas from 'html2canvas-pro';

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
 * Creates a comprehensive override stylesheet by sampling all elements
 * and applying their computed colors. This overrides lab() colors from Tailwind CSS.
 */
function convertStylesheetColors() {
  const overrideStyle = document.createElement('style');
  overrideStyle.setAttribute('data-br-color-override', 'true');
  overrideStyle.setAttribute('type', 'text/css');
  
  const colorMap = new Map(); // Map of selector -> color properties
  const maxElements = 1000; // Limit to avoid performance issues
  let elementCount = 0;
  
  try {
    // Sample all elements and get their computed colors
    const allElements = document.querySelectorAll('*');
    
    for (let i = 0; i < allElements.length && elementCount < maxElements; i++) {
      const el = allElements[i];
      
      // Skip widget elements
      if (el.classList.contains('br-widget') || el.classList.contains('br-trigger-btn')) {
        continue;
      }
      
      try {
        const computed = window.getComputedStyle(el);
        
        // Build a unique selector for this element
        let selector = '';
        if (el.id) {
          selector = `#${CSS.escape(el.id)}`;
        } else if (el.className && typeof el.className === 'string') {
          const classes = el.className.trim().split(/\s+/).filter(c => c && !c.includes('br-'));
          if (classes.length > 0) {
            // Use first few classes to avoid overly specific selectors
            const classSelector = '.' + classes.slice(0, 3).map(c => CSS.escape(c)).join('.');
            selector = `${el.tagName.toLowerCase()}${classSelector}`;
          }
        }
        
        if (!selector) {
          selector = el.tagName.toLowerCase();
        }
        
        // Get computed color values (browser has already converted lab() to rgb)
        const colorProps = {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          borderTopColor: computed.borderTopColor,
          borderRightColor: computed.borderRightColor,
          borderBottomColor: computed.borderBottomColor,
          borderLeftColor: computed.borderLeftColor
        };
        
        // Only store if colors are valid (not lab/lch and not transparent)
        const validColors = {};
        Object.entries(colorProps).forEach(([prop, value]) => {
          if (value && 
              value !== 'transparent' && 
              value !== 'rgba(0, 0, 0, 0)' &&
              !value.includes('lab(') && 
              !value.includes('lch(')) {
            validColors[prop] = value;
          }
        });
        
        if (Object.keys(validColors).length > 0) {
          // Store or merge with existing selector
          if (!colorMap.has(selector)) {
            colorMap.set(selector, validColors);
            elementCount++;
          } else {
            // Merge colors (prefer non-transparent values)
            const existing = colorMap.get(selector);
            Object.entries(validColors).forEach(([prop, value]) => {
              if (!existing[prop] || existing[prop] === 'transparent' || existing[prop] === 'rgba(0, 0, 0, 0)') {
                existing[prop] = value;
              }
            });
          }
        }
      } catch (e) {
        // Skip elements that can't be processed
        continue;
      }
    }
  } catch (e) {
    console.warn('Failed to sample elements:', e);
  }
  
  // Build CSS rules from the color map
  const rules = [];
  colorMap.forEach((colors, selector) => {
    try {
      const ruleParts = [];
      
      if (colors.color) {
        ruleParts.push(`color: ${colors.color} !important;`);
      }
      if (colors.backgroundColor) {
        ruleParts.push(`background-color: ${colors.backgroundColor} !important;`);
      }
      if (colors.borderColor) {
        ruleParts.push(`border-color: ${colors.borderColor} !important;`);
      }
      if (colors.borderTopColor) {
        ruleParts.push(`border-top-color: ${colors.borderTopColor} !important;`);
      }
      if (colors.borderRightColor) {
        ruleParts.push(`border-right-color: ${colors.borderRightColor} !important;`);
      }
      if (colors.borderBottomColor) {
        ruleParts.push(`border-bottom-color: ${colors.borderBottomColor} !important;`);
      }
      if (colors.borderLeftColor) {
        ruleParts.push(`border-left-color: ${colors.borderLeftColor} !important;`);
      }
      
      if (ruleParts.length > 0) {
        rules.push(`${selector} { ${ruleParts.join(' ')} }`);
      }
    } catch (e) {
      // Skip invalid selectors
    }
  });
  
  // Add a global fallback that uses computed colors
  // This ensures any element not explicitly covered still gets computed colors
  const globalFallback = `
    *:not(.br-widget):not(.br-trigger-btn):not(.br-widget *) {
      color: inherit !important;
      background-color: inherit !important;
      border-color: inherit !important;
    }
  `;
  
  overrideStyle.textContent = globalFallback + '\n' + rules.join('\n');
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
 * Wrapper for html2canvas-pro that handles errors gracefully
 * html2canvas-pro supports modern color functions like lab() and lch()
 */
async function safeHtml2canvas(element, options) {
  try {
    return await html2canvas(element, options);
  } catch (error) {
    // html2canvas-pro should handle lab()/lch() colors, but if we still get errors, provide helpful message
    if (error.message && (error.message.includes('lab') || error.message.includes('lch') || error.message.includes('color function'))) {
      const enhancedError = new Error(
        'Screenshot capture failed: Unable to parse CSS color functions. ' +
        'This may occur with very new CSS features. Please report this issue.'
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
  
  // Also apply computed colors as inline styles to all elements
  // This ensures maximum specificity to override lab() colors
  const originalStyles = new Map();
  const allElements = document.querySelectorAll('*:not(.br-widget):not(.br-trigger-btn):not(.br-widget *)');
  const maxInlineElements = 500; // Limit for performance
  
  for (let i = 0; i < Math.min(allElements.length, maxInlineElements); i++) {
    const el = allElements[i];
    try {
      const computed = window.getComputedStyle(el);
      const originalStyle = el.getAttribute('style') || '';
      originalStyles.set(el, originalStyle);
      
      // Apply computed colors as inline styles (highest specificity)
      const colorProps = ['color', 'backgroundColor', 'borderColor'];
      let newStyle = originalStyle;
      
      colorProps.forEach(prop => {
        const value = computed[prop];
        if (value && 
            value !== 'transparent' && 
            value !== 'rgba(0, 0, 0, 0)' &&
            !value.includes('lab(') && 
            !value.includes('lch(')) {
          const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
          // Only add if not already present
          if (!originalStyle.includes(cssProp + ':')) {
            newStyle = `${newStyle}; ${cssProp}: ${value}`.trim();
          }
        }
      });
      
      if (newStyle !== originalStyle) {
        el.setAttribute('style', newStyle);
        el.setAttribute('data-br-temp-style', 'true');
      }
    } catch (e) {
      // Skip elements that can't be processed
    }
  }
  
  // Wait a bit for styles to apply
  await new Promise(resolve => setTimeout(resolve, 100));

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
    
    // Restore original inline styles
    originalStyles.forEach((originalStyle, el) => {
      try {
        if (el.hasAttribute('data-br-temp-style')) {
          if (originalStyle) {
            el.setAttribute('style', originalStyle);
          } else {
            el.removeAttribute('style');
          }
          el.removeAttribute('data-br-temp-style');
        }
      } catch (e) {
        // Ignore errors
      }
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
    
    // Restore original inline styles even on error
    originalStyles.forEach((originalStyle, el) => {
      try {
        if (el.hasAttribute('data-br-temp-style')) {
          if (originalStyle) {
            el.setAttribute('style', originalStyle);
          } else {
            el.removeAttribute('style');
          }
          el.removeAttribute('data-br-temp-style');
        }
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Remove override stylesheet even on error
    removeColorOverrideStylesheet(overrideStyle);
    
    // If error is related to lab() color parsing, provide Tailwind-specific solution
    if (error.message && (error.message.includes('lab') || error.message.includes('lch'))) {
      console.warn('Screenshot capture failed: html2canvas cannot parse lab()/lch() colors from Tailwind CSS. Configure Tailwind to use RGB colors or use a build-time converter.');
      throw new Error(
        'Screenshot capture failed: html2canvas cannot parse lab()/lch() colors used by Tailwind CSS v3+. ' +
        'Solution: Configure Tailwind to output RGB colors. See: https://tailwindcss.com/docs/customizing-colors#using-css-variables'
      );
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
  
  // Also apply computed colors as inline styles to all elements
  const originalStyles = new Map();
  const allElements = document.querySelectorAll('*:not(.br-widget):not(.br-trigger-btn):not(.br-widget *)');
  const maxInlineElements = 500; // Limit for performance
  
  for (let i = 0; i < Math.min(allElements.length, maxInlineElements); i++) {
    const el = allElements[i];
    try {
      const computed = window.getComputedStyle(el);
      const originalStyle = el.getAttribute('style') || '';
      originalStyles.set(el, originalStyle);
      
      // Apply computed colors as inline styles (highest specificity)
      const colorProps = ['color', 'backgroundColor', 'borderColor'];
      let newStyle = originalStyle;
      
      colorProps.forEach(prop => {
        const value = computed[prop];
        if (value && 
            value !== 'transparent' && 
            value !== 'rgba(0, 0, 0, 0)' &&
            !value.includes('lab(') && 
            !value.includes('lch(')) {
          const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
          if (!originalStyle.includes(cssProp + ':')) {
            newStyle = `${newStyle}; ${cssProp}: ${value}`.trim();
          }
        }
      });
      
      if (newStyle !== originalStyle) {
        el.setAttribute('style', newStyle);
        el.setAttribute('data-br-temp-style', 'true');
      }
    } catch (e) {
      // Skip elements that can't be processed
    }
  }
  
  // Wait a bit for styles to apply
  await new Promise(resolve => setTimeout(resolve, 100));

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
    
    // Restore original inline styles
    originalStyles.forEach((originalStyle, el) => {
      try {
        if (el.hasAttribute('data-br-temp-style')) {
          if (originalStyle) {
            el.setAttribute('style', originalStyle);
          } else {
            el.removeAttribute('style');
          }
          el.removeAttribute('data-br-temp-style');
        }
      } catch (e) {
        // Ignore errors
      }
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
    
    // Restore original inline styles even on error
    originalStyles.forEach((originalStyle, el) => {
      try {
        if (el.hasAttribute('data-br-temp-style')) {
          if (originalStyle) {
            el.setAttribute('style', originalStyle);
          } else {
            el.removeAttribute('style');
          }
          el.removeAttribute('data-br-temp-style');
        }
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Remove override stylesheet even on error
    removeColorOverrideStylesheet(overrideStyle);
    
    // If error is related to lab() color parsing, provide Tailwind-specific solution
    if (error.message && (error.message.includes('lab') || error.message.includes('lch'))) {
      console.warn('Screenshot capture failed: html2canvas cannot parse lab()/lch() colors from Tailwind CSS. Configure Tailwind to use RGB colors or use a build-time converter.');
      throw new Error(
        'Screenshot capture failed: html2canvas cannot parse lab()/lch() colors used by Tailwind CSS v3+. ' +
        'Solution: Configure Tailwind to output RGB colors. See: https://tailwindcss.com/docs/customizing-colors#using-css-variables'
      );
    }
    
    throw error;
  }
}
