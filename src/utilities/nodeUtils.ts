// utils/nodeUtils.ts

interface Node {
    type: string;
    name?: string;
    data?: string;
    attribs?: { [key: string]: string };
    children?: Node[];
  }
  
  export const getNodeContent = (node: Node): string => {
    if (node.type === "text") {
      return node.data || "";
    }
    const attributes = Object.entries(node.attribs || {})
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");
    const openTag = `<${node.name}${attributes ? " " + attributes : ""}>`;
    const closeTag = `</${node.name}>`;
    const childContent = node.children
      ? node.children.map(getNodeContent).join("")
      : "";
    return `${openTag}${childContent}${closeTag}`;
  };