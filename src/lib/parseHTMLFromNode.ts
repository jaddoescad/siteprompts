// Helper function to parse HTML string into a tree structure
export const parseHTMLFromNode = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
  
    const traverse = (node, path = "") => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.trim()
          ? { type: "text", content: node.textContent, path }
          : null;
      }
  
      if (node.nodeType === Node.ELEMENT_NODE) {
        const children = Array.from(node.childNodes)
          .map((child, index) => traverse(child, `${path}/${index}`))
          .filter(Boolean);
  
        return {
          type: node.tagName.toLowerCase(),
          attributes: Object.fromEntries(
            Array.from(node.attributes).map((attr) => [attr.name, attr.value])
          ),
          children,
          path,
        };
      }
  
      return null;
    };
    return traverse(doc.body);
  };