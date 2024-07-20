import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export const TreeNode = ({ node, onNodeClick, path }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
  
    const handleClick = (e) => {
      e.stopPropagation();
      onNodeClick(node, path);
    };
  
    if (node.type === "text") {
      return node.data.trim() ? (
        <div className="ml-4 text-gray-600">{node.data}</div>
      ) : null;
    }
  
    return (
      <div className="ml-4">
        <div className="flex items-center">
          {hasChildren ? (
            <button onClick={() => setIsOpen(!isOpen)} className="mr-1">
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="mr-1 h-4 w-4" />
          )}
          <span className="cursor-pointer text-blue-600" onClick={handleClick}>
            &lt;{node.name}&gt; ({path})
          </span>
        </div>
        {isOpen && hasChildren && (
          <div className="ml-4">
            {node.children
              .filter(
                (child) => child.type !== "text" || child.data.trim() !== ""
              )
              .map((child, idx) => (
                <TreeNode
                  key={idx}
                  node={child}
                  onNodeClick={onNodeClick}
                  path={`${path}-${idx + 1}`}
                />
              ))}
          </div>
        )}
      </div>
    );
  };