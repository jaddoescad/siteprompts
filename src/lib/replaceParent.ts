export function replaceParent(parentTemplate, childHTML) {
    // Create a temporary div to parse the HTML strings
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = childHTML.trim();
  
    // Get the root element of the child HTML
    const childRoot = tempDiv.firstChild;
  
    // Extract the content of the child root element
    const childContent = childRoot.innerHTML;
  
    // Replace {children} in the parent template with the child content
    const newHTML = parentTemplate.replace('{children}', childContent);
  
    return newHTML;
  }