export const highlightElementUtil = (htmlContent, path) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Find the element based on the path
  let currentElement = doc.body;
  for (let i = 1; i < path.length; i++) {
    const index = path[i] - 1;
    if (currentElement && currentElement.children && index >= 0 && index < currentElement.children.length) {
      currentElement = currentElement.children[index];
    } else {
      console.error('Invalid path:', path);
      return htmlContent;
    }
  }
  
  if (currentElement) {
    // Add a class to the element for highlighting
    currentElement.classList.add('highlight-element');
    
    // Create a style element if it doesn't exist
    let styleElement = doc.querySelector('style#highlight-styles');
    if (!styleElement) {
      styleElement = doc.createElement('style');
      styleElement.id = 'highlight-styles';
      doc.head.appendChild(styleElement);
    }
    
    // Add or update the highlighting styles
    styleElement.textContent = `
      .highlight-element {
        position: relative;
      }
      .highlight-element::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 2px solid red;
        pointer-events: none;
        z-index: 9999;
      }
    `;
  }
  
  return doc.documentElement.outerHTML;
};