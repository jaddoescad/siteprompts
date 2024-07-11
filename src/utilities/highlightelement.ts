// highlightUtils.js

export const highlightElementUtil = (htmlContent, path) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Remove background color from all elements
    doc.body.querySelectorAll('[style*="background-color: yellow"]').forEach((el) => {
      el.style.removeProperty('background-color');
    });
    
    // Find and highlight the element based on the path
    let currentElement = doc.body.firstElementChild;
    for (let i = 1; i < path.length; i++) {
      const index = path[i] - 1;
      if (currentElement && index >= 0 && index < currentElement.children.length) {
        currentElement = currentElement.children[index];
      } else {
        console.error('Invalid path');
        return htmlContent;
      }
    }
    
    if (currentElement) {
        currentElement.style.border = '2px solid red';
      }
    
    return doc.body.innerHTML;
  };