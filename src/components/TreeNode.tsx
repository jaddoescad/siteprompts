'use client'

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export const TreeNode = ({ node, onNodeClick, path }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  
  const handleClick = (e) => {
    e.stopPropagation();
    onNodeClick(node, path);
  };

  if (node.type === 'text') {
    return node.data.trim() ? (
      <div className="ml-4 text-gray-600">
        {node.data}
      </div>
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
          <span className="w-4 h-4 mr-1" />
        )}
        <span className="text-blue-600 cursor-pointer" onClick={handleClick}>
          &lt;{node.name}&gt; (Path: {path})
        </span>
      </div>
      {isOpen && hasChildren && (
        <div className="ml-4">
         {node.children.filter(child => child.type !== 'text' || child.data.trim() !== '').map((child, idx) => (
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