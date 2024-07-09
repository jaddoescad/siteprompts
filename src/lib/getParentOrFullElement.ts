function countHTMLNodes(htmlString) {
    // Create a temporary DOM element
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
  
    // Recursive function to count nodes
    function countNodes(node) {
      let count = 1; // Count the current node
      // Count child nodes
      for (let child of node.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          count += countNodes(child);
        }
      }
      return count;
    }
  
    // Start counting from the body element
    return countNodes(doc.body) - 1; // Subtract 1 to exclude the body tag itself
  }
  
  export function getParentOrFullElement(htmlString) {
    const nodeCount = countHTMLNodes(htmlString);
  
    if (nodeCount === 1) {
      // If there's only one node, return the full HTML string
      return htmlString.trim();
    } else {
      // If there are multiple nodes, process the parent
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString.trim();
      const targetElement = tempDiv.firstChild;
      
      // Clone the parent element without its children
      const parentClone = targetElement.cloneNode(false);
      
      // Add the {children} placeholder
      parentClone.innerHTML = '{children}';
      
      // Return the HTML string of the parent with {parent} wrapper
      return `${parentClone.outerHTML}`;
    }
  }
  