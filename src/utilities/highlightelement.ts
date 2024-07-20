// highlightUtils.js

export const highlightElementUtil = (htmlContent, path) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Find and highlight the element based on the path
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
    currentElement.style.boxShadow = 'inset 0 0 0 2px red';
  }
  
  return doc.body.innerHTML;
};
