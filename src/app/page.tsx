'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react';
import parse, { Element } from 'html-react-parser';
import dynamic from 'next/dynamic';
import { loader } from '@monaco-editor/react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { Input } from '@/components/ui/Input';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Loader2 } from 'lucide-react'; // Import Loader2 icon
import { Switch } from '@/components/ui/Switch'; // Note the capital 'S' in Switch
import { highlightElementUtil } from '@/lib/highlightelement';
import { getParentOrFullElement } from '@/lib/getParentOrFullElement';
import { replaceParent } from '@/lib/replaceParent';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs' },
});

const TreeNode = ({ node, onNodeClick, path }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = (e) => {
    e.stopPropagation();
    onNodeClick(node, path);
  };

  if (node.type === 'text') {
    return node.data.trim() ? (
      <div className='ml-4 text-gray-600'>{node.data}</div>
    ) : null;
  }

  return (
    <div className='ml-4'>
      <div className='flex items-center'>
        {hasChildren ? (
          <button onClick={() => setIsOpen(!isOpen)} className='mr-1'>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className='mr-1 h-4 w-4' />
        )}
        <span className='cursor-pointer text-blue-600' onClick={handleClick}>
          &lt;{node.name}&gt;
        </span>
      </div>
      {isOpen && hasChildren && (
        <div className='ml-4'>
          {node.children
            .filter(
              (child) => child.type !== 'text' || child.data.trim() !== ''
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

const HTMLParserComponent = () => {
  const [originalHtmlContent, setOriginalHtmlContent] = useState(`
  <div class="bg-gray-100 h-full min-h-screen flex flex-col">
  <header class="p-4">
<nav class="container mx-auto flex items-center justify-between">
<div class="flex items-center">
  <div class="mr-4 h-[48px]">
      <img src="https://i.pinimg.com/736x/e8/41/1e/e8411ecd9caa00c31d26607b51dc4851.jpg" alt="Logo" class="h-full w-full object-contain"></img>
  </div>
  <ul class="flex space-x-4">
      <li><a href="#" class="text-blue-600 hover:text-blue-800">Home</a></li>
      <li><a href="#" class="text-blue-600 hover:text-blue-800">About</a></li>
      <li><a href="#" class="text-blue-600 hover:text-blue-800">Contact</a></li>
  </ul>
</div>
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Contact Us</button>
</nav>
</header>

  <main class="flex-grow container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Welcome to Our Website</h1>
      <p class="mb-4">This is the main content area of our simple website. You can add more sections, images, and other content here.</p>
  </main>

  <footer class="bg-gray-200 p-6 mt-auto">
<div class="container mx-auto px-4 max-w-6xl">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
          <h3 class="font-bold text-lg mb-2">About Us</h3>
          <p class="text-sm text-gray-600">Simple Website is dedicated to providing quality content and services.</p>
      </div>
      <div>
          <h3 class="font-bold text-lg mb-2">Quick Links</h3>
          <ul class="space-y-2">
              <li><a href="#" class="text-blue-600 hover:text-blue-800">Home</a></li>
              <li><a href="#" class="text-blue-600 hover:text-blue-800">Services</a></li>
              <li><a href="#" class="text-blue-600 hover:text-blue-800">Contact</a></li>
          </ul>
      </div>
      <div class="md:text-right">
          <h3 class="font-bold text-lg mb-2">Follow Us</h3>
          <div class="flex md:justify-end space-x-4">
              <a href="#" class="text-gray-600 hover:text-gray-800"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg></a>
              <a href="#" class="text-gray-600 hover:text-gray-800"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path></svg></a>
              <a href="#" class="text-gray-600 hover:text-gray-800"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"></svg></a></div></div></div></div></footer>
</div>
  `);
  const [command, setCommand] = useState('');
  const [selectedNodeContent, setSelectedNodeContent] = useState('');
  const [selectedNodePath, setSelectedNodePath] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParentMode, setIsParentMode] = useState(false);
  const [parentContent, setParentContent] = useState('');
  const [previewHtmlContent, setPreviewHtmlContent] = useState(originalHtmlContent);

  const editorRef = useRef(null);

  const getNodeContent = (node) => {
    if (node.type === 'text') {
      return node.data;
    }
    const attributes = Object.entries(node.attribs || {})
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    const openTag = `<${node.name}${attributes ? ' ' + attributes : ''}>`;
    const closeTag = `</${node.name}>`;
    const childContent = node.children
      ? node.children.map(getNodeContent).join('')
      : '';
    return `${openTag}${childContent}${closeTag}`;
  };

  const handleNodeClick = (node, path) => {
    const content = getNodeContent(node);
    setSelectedNodeContent(content);
    setParentContent(getParentOrFullElement(content));
    const newPath = path.split('-').map(Number);
    setSelectedNodePath(newPath);
    
    // Apply highlighting immediately
    const newPreviewContent = highlightElementUtil(originalHtmlContent, newPath);
    setPreviewHtmlContent(newPreviewContent);
  };

  useEffect(() => {
    setSelectedNodeContent(originalHtmlContent);
    setParentContent(getParentOrFullElement(originalHtmlContent));
  }, []);

  useEffect(() => {
    if (selectedNodeContent !== '' && !isParentMode) {
      updateHtmlContent(selectedNodeContent);
    }
  }, [selectedNodeContent, isParentMode]);

  const handleEditorChange = (value) => {
    if (isParentMode) {
      const newParentContent = value;
      setParentContent(newParentContent);
      // Update selectedNodeContent when parent is changed
      const newSelectedNodeContent = replaceParent(newParentContent, selectedNodeContent);
      setSelectedNodeContent(newSelectedNodeContent);
      // Update the HTML content
      updateHtmlContent(newSelectedNodeContent);
    } else {
      setSelectedNodeContent(value);
    }
  };


  const handleToggleChange = (e) => {
    const checked = e.target.checked;
    setIsParentMode(checked);
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const updateHtmlContent = (newContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(previewHtmlContent, 'text/html');

    let currentElement = doc.body.firstElementChild;
    for (let i = 1; i < selectedNodePath.length; i++) {
      const index = selectedNodePath[i] - 1;
      if (
        currentElement &&
        index >= 0 &&
        index < currentElement.children.length
      ) {
        currentElement = currentElement.children[index];
      } else {
        console.error('Invalid path');
        return;
      }
    }

    if (currentElement) {
      currentElement.outerHTML = newContent;
      const newOriginalContent = doc.body.innerHTML;
      setOriginalHtmlContent(newOriginalContent);
      
      // Apply highlighting to the updated content
      const newPreviewContent = highlightElementUtil(newOriginalContent, selectedNodePath);
      setPreviewHtmlContent(newPreviewContent);
    }
  };

  const handleCommandChange = (e) => {
    setCommand(e.target.value);
  };

  const handleCommandSubmit = useCallback(
    async (e) => {
      if (e.key === 'Enter') {
        setIsLoading(true);
        try {
          const response = await fetch('/api/claude', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: isParentMode ? parentContent : selectedNodeContent,
              userInstruction: command,
            }),
          });

          if (!response.ok) {
            throw new Error('API request failed');
          }

          const result = await response.text();

          // Update the editor with Claude's analysis
          if (editorRef.current) {
            editorRef.current.setValue(result);
          }

          // Update the selected node content and HTML content
          if (isParentMode) {
            setParentContent(result);
            const newSelectedNodeContent = replaceParent(result, selectedNodeContent);
            setSelectedNodeContent(newSelectedNodeContent);
            updateHtmlContent(newSelectedNodeContent);
          } else {
            setSelectedNodeContent(result);
            updateHtmlContent(result);
          }
        } catch (error) {
          console.error('Error calling Claude API:', error);
          if (editorRef.current) {
            editorRef.current.setValue(
              'An error occurred while processing your request.'
            );
          }
        } finally {
          setIsLoading(false);
        }
      }
    },
    [selectedNodeContent, parentContent, command, isParentMode]
  );

  const parsedContent = parse(originalHtmlContent, {
    replace: (domNode) => {
      if (domNode instanceof Element) {
        return (
          <TreeNode node={domNode} onNodeClick={handleNodeClick} path='1' />
        );
      }
    },
  });

  return (
    <PanelGroup direction='horizontal'>
      <Panel minSize={20}>
        <div className='h-full overflow-auto bg-gray-50 p-4'>
          {parsedContent}
        </div>
      </Panel>
      <PanelResizeHandle className='w-2 bg-gray-200 transition-colors hover:bg-gray-300' />
      <Panel minSize={20}>
        <div className='h-full p-4 overflow-scroll'>{parse(previewHtmlContent)}</div>
      </Panel>
      <PanelResizeHandle className='w-2 bg-gray-200 transition-colors hover:bg-gray-300' />
      <Panel minSize={20}>
        <div className='flex h-full flex-col overflow-hidden bg-gray-100'>
          <div className='flex items-center bg-gray-200 p-2'>
            <Switch
              checked={isParentMode}
              onChange={handleToggleChange}
              label={'Parent Mode'}
            />
          </div>
          <div className='flex-1'>
            {isLoading && (
              <div className='absolute inset-0 z-10 flex items-center justify-center bg-gray-800 bg-opacity-50'>
                <Loader2 className='h-8 w-8 animate-spin text-white' />
              </div>
            )}
            <MonacoEditor
              height='100%'
              language='html'
              theme='vs-dark'
              value={isParentMode ? parentContent : selectedNodeContent}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                wordWrap: 'off',
              }}
            />
          </div>
        </div>
      </Panel>
      <div className='fixed bottom-20 left-1/2 -translate-x-1/2 transform'>
        <Input
          className='w-64 rounded-full px-4 py-2 shadow-lg'
          placeholder='Enter a command...'
          value={command}
          onChange={handleCommandChange}
          onKeyPress={handleCommandSubmit}
        />
      </div>
    </PanelGroup>
  );
};

export default HTMLParserComponent;