import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { Input } from "@/components/ui/input";
import { GripVertical } from 'lucide-react';

const DraggableInput = ({ command, handleCommandChange, handleCommandSubmit }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleDrag = (e, ui) => {
    const { x, y } = ui;
    setPosition({ x, y });
  };

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
      <Draggable
        handle=".handle"
        defaultPosition={{ x: 0, y: 0 }}
        position={position}
        onDrag={handleDrag}
      >
        <div className="flex items-center bg-white rounded-full shadow-lg">
          <div className="handle cursor-move p-2">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            className="w-64 rounded-r-full px-4 py-2"
            placeholder="Enter a command..."
            value={command}
            onChange={handleCommandChange}
            onKeyPress={handleCommandSubmit}
          />
        </div>
      </Draggable>
    </div>
  );
};

export default DraggableInput;