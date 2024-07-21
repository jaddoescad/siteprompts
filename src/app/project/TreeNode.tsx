import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

interface TreeNodeProps {
  node: any;
  onNodeClick: (node: any, path: string) => void;
  path: string;
  expandedNodes: Set<string>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  onAddSibling: (path: string) => void;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  onNodeClick, 
  path, 
  expandedNodes, 
  setExpandedNodes,
  onAddSibling
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = expandedNodes.has(path);

  useEffect(() => {
    if (hasChildren && path === "1") {
      setExpandedNodes(prev => new Set(prev).add(path));
    }
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(node, path);
  };

  const handleAddSibling = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddSibling(path);
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
          <button onClick={handleToggle} className="mr-1">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="mr-1 h-4 w-4" />
        )}
        <span className="cursor-pointer text-blue-600" onClick={handleClick}>
          &lt;{node.name}&gt; ({path})
        </span>
        <button onClick={handleAddSibling} className="ml-2 text-green-500" title="Add sibling div">
          <Plus size={16} />
        </button>
      </div>
      {isOpen && hasChildren && (
        <div className="ml-4">
          {node.children
            .filter(
              (child: any) => child.type !== "text" || child.data.trim() !== ""
            )
            .map((child: any, idx: number) => (
              <TreeNode
                key={idx}
                node={child}
                onNodeClick={onNodeClick}
                path={`${path}-${idx + 1}`}
                expandedNodes={expandedNodes}
                setExpandedNodes={setExpandedNodes}
                onAddSibling={onAddSibling}
              />
            ))}
        </div>
      )}
    </div>
  );
};