"use client";

import React, { useState, useRef, useCallback, useEffect, use } from "react";
import parse, { Element } from "html-react-parser";
import dynamic from "next/dynamic";
import { loader } from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { ChevronDown, ChevronRight, Redo, Undo } from "lucide-react";
import { Loader2 } from "lucide-react"; // Import Loader2 icon
import { highlightElementUtil } from "@/utilities/highlightelement";
import { getParentOrFullElement } from "@/utilities/getParentOrFullElement";
import { replaceParent } from "@/utilities/replaceParent";
import { FilesView } from "@/components/FilesView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { Label } from "@/components/ui/label";
import { saveHtmlContent } from "@/services/supabaseClientFunctions";
import debounce from "lodash.debounce";
import useUndo from "use-undo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";


const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs" },
});

const TreeNode = ({ node, onNodeClick, path }) => {
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





interface ProjectEditorProps {
    initialHtmlContent: string;
    projectId: string;
  }

  interface EditorState {
    htmlContent: string;
    selectedNodeContent: string;
    selectedNodePath: number[];
  }

  const ProjectEditor: React.FC<ProjectEditorProps> = ({
    initialHtmlContent,
    projectId,
  }) => {
    const [
      editorState,
      {
        set: setEditorState,
        reset: resetEditorState,
        undo: undoEditorState,
        redo: redoEditorState,
        canUndo,
        canRedo,
      },
    ] = useUndo<EditorState>({
      htmlContent: initialHtmlContent,
      selectedNodeContent: initialHtmlContent,
      selectedNodePath: [1],
    });

    const { present: currentState } = editorState;
    const [lastSavedContent, setLastSavedContent] =
      useState(initialHtmlContent);

    const [previewHtmlContent, setPreviewHtmlContent] =
      useState(initialHtmlContent);

    const [command, setCommand] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isParentMode, setIsParentMode] = useState(false);
    const [parentContent, setParentContent] = useState("");

    const [saveStatus, setSaveStatus] = useState("");
    const [isInitialLoad, setIsInitialLoad] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const previousEditorContentRef = useRef(initialHtmlContent);
    const iframeRef = useRef<HTMLIFrameElement>(null);


    const saveProjectHtmlContent = useCallback(
      debounce(async (content) => {
        setSaveStatus("Saving...");
        try {
          await saveHtmlContent(projectId, content);
          setLastSavedContent(content);
          setSaveStatus("Saved");
          setTimeout(() => setSaveStatus(""), 2000);
        } catch (error) {
          console.error("Error saving HTML content:", error);
          setSaveStatus("Error saving");
          // Handle error (e.g., show error message to user)
        }
      }, 1000),
      [projectId]
    );

    const updateIframeContent = useCallback((content: string) => {
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
        if (iframeDoc) {
          // Store the current scroll position
          const scrollPosition = {
            x: iframeDoc.documentElement.scrollLeft || iframeDoc.body.scrollLeft,
            y: iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop
          };
    
          // Update the content
          const contentWrapper = iframeDoc.getElementById('content-wrapper');
          if (contentWrapper) {
            contentWrapper.innerHTML = content;
          } else {
            // If content-wrapper doesn't exist, update the body
            iframeDoc.body.innerHTML = `<div id="content-wrapper">${content}</div>`;
          }
    
          // Restore the scroll position
          iframeDoc.documentElement.scrollTo(scrollPosition.x, scrollPosition.y);
          iframeDoc.body.scrollTo(scrollPosition.x, scrollPosition.y);
    
          // Reapply styles
          const styleElement = iframeDoc.getElementById('highlight-styles');
          if (!styleElement) {
            const newStyle = iframeDoc.createElement('style');
            newStyle.id = 'highlight-styles';
            newStyle.textContent = `
              .highlight-element {
                position: relative;
              }
              .highlight-element::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border: 2px solid red;
                pointer-events: none;
                z-index: 9999;
              }
            `;
            iframeDoc.head.appendChild(newStyle);
          }
        }
      }
    }, []);

    useEffect(() => {
      const newPreviewContent = highlightElementUtil(
        currentState.htmlContent,
        currentState.selectedNodePath
      );
      updateIframeContent(newPreviewContent);
    }, [currentState.htmlContent, currentState.selectedNodePath, updateIframeContent]);

    useEffect(() => {
      if (currentState.htmlContent !== lastSavedContent && !isInitialLoad) {
        saveProjectHtmlContent(currentState.htmlContent);
      }
    }, [currentState.htmlContent]);

    const editorRef = useRef(null);

    const getNodeContent = (node) => {
      if (node.type === "text") {
        return node.data;
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

    const handleNodeClick = (node, path) => {
      const content = getNodeContent(node);
      const newPath = path.split("-").map(Number);

      setEditorState({
        ...currentState,
        selectedNodeContent: content,
        selectedNodePath: newPath,
      });

      const newPreviewContent = highlightElementUtil(
        currentState.htmlContent,
        newPath
      );
      setPreviewHtmlContent(newPreviewContent);
      setEditorKey((prevKey) => prevKey + 1);
    };

  

    const handleToggleChange = (checked: boolean) => {
      setIsParentMode(checked);
      if (checked) {
        const parentElement = getParentOrFullElement(currentState.selectedNodeContent);
        setParentContent(parentElement);
      }
      setEditorKey((prevKey) => prevKey + 1);
    };

    const handleEditorDidMount = (editor) => {
      editorRef.current = editor;
    };

    const updateFullHTMLContent = (newContent) => {
      const isValidHtml = /^<[^>]+>[\s\S]*<\/[^>]+>$/.test(newContent.trim());

      var content = newContent.trim();

      if (!isValidHtml && newContent.trim() !== "") {
        // Wrap the content in a div if it's not valid HTML
        content = `<div>${newContent}</div>`;
      }

      const doc = new DOMParser().parseFromString(
        currentState.htmlContent,
        "text/html"
      );

      const isUpdatingEntireBody =
        currentState.selectedNodePath.length === 1 && currentState.selectedNodePath[0] === 1;

      if (isUpdatingEntireBody) {
        doc.body.innerHTML = content;
      } else {
        let targetElement = doc.body;
        let parentElement = doc.body;

        // Navigate to the target element using the selectedNodePath
        for (let i = 1; i < currentState.selectedNodePath.length; i++) {
          const childIndex = currentState.selectedNodePath[i] - 1;
          const nextElement = targetElement.children[childIndex] as HTMLElement;

          if (!nextElement) {
            parentElement.innerHTML += content;
            break;
          }

          parentElement = targetElement;
          targetElement = nextElement;
        }
        // Check if we should insert before the target element
        if (
          content.trim() !== "" &&
          previousEditorContentRef.current.trim() === "" &&
          targetElement !== parentElement
        ) {
          targetElement.insertAdjacentHTML("beforebegin", content);
        } else if (targetElement !== parentElement) {
          // Update the target element if it exists and we're not inserting before it
          targetElement.outerHTML = content;
        }
      }
      const updatedHtmlContent = doc.body.innerHTML;

      // Update the full HTML content
      setEditorState({
        ...currentState,
        selectedNodeContent: newContent,
        htmlContent: updatedHtmlContent
      });
      setPreviewHtmlContent(updatedHtmlContent);
    };

    const handleEditorChange = (value: string) => {
      if (isParentMode) {
        const newParentContent = value;
        const newSelectedNodeContent = replaceParent(
          newParentContent,
          currentState.selectedNodeContent
        );
        updateFullHTMLContent(newSelectedNodeContent);
        previousEditorContentRef.current = newParentContent;
      } else {
        updateFullHTMLContent(value);
        previousEditorContentRef.current = value;
      }
    };

    useEffect(() => {
      //fix
      // setSelectedNodeContent(currentState.htmlContent);
      // setSelectedNodePath([1]);
      setEditorState({
        ...currentState,
        selectedNodeContent: currentState.htmlContent,
        selectedNodePath: [1],
      });
      
    }, []);

    useEffect(() => {
      const newPreviewContent = highlightElementUtil(
        currentState.htmlContent,
        currentState.selectedNodePath
      );
      setPreviewHtmlContent(newPreviewContent);
    }, [currentState.htmlContent]);

    const handleUndo = () => {
      undoEditorState();
      setEditorKey((prevKey) => prevKey + 1);
    };

    const handleRedo = () => {
      redoEditorState();
      setEditorKey((prevKey) => prevKey + 1);
    };

    const handleCommandChange = (e) => {
      setCommand(e.target.value);
    };

    const handleCommandSubmit = async (e) => {
      if (e.key === "Enter") {
        setIsLoading(true);
        try {
          const editorContent = editorRef?.current?.getValue();

          const response = await fetch("/api/claude", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: editorContent,
              userInstruction: command,
            }),
          });

          if (!response.ok) {
            throw new Error("API request failed");
          }

          const result = await response.text();

          if (isParentMode) {
            setParentContent(result);
            const newParentContent = result;
            // Update selectedNodeContent when parent is changed
            const newSelectedNodeContent = replaceParent(
              newParentContent,
              currentState.selectedNodeContent
            );

            updateFullHTMLContent(newSelectedNodeContent);
          } else {
            // setSelectedNodeContent(result);
            setEditorKey((prevKey) => prevKey + 1);
            updateFullHTMLContent(result);

          }
          // editorRef.current.setValue(result);
        } catch (error) {
          console.error("Error calling Claude API:", error);
          alert("Error calling Claude API");
        } finally {
          setIsLoading(false);
        }
      }
    };

    // In the ProjectEditor component, update the parsedContent generation:
    const parsedContent = parse(`<body>${currentState.htmlContent}</body>`, {
      replace: (domNode) => {
        if (domNode instanceof Element && domNode.type === "tag") {
          return (
            <TreeNode node={domNode} onNodeClick={handleNodeClick} path="1" />
          );
        }
      },
    });



    return (
      <>
        <Header />
        <PanelGroup direction="horizontal">
          <Panel minSize={20}>
            <Tabs defaultValue="tree" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tree">Tree</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
              <TabsContent value="tree" className="flex-grow overflow-hidden">
                <div className="h-full overflow-auto bg-gray-50 p-4">
                  {parsedContent}
                </div>
              </TabsContent>
              <TabsContent value="files" className="flex-grow overflow-hidden">
                <FilesView />
              </TabsContent>
            </Tabs>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 transition-colors hover:bg-gray-300" />
          <Panel minSize={20}>
            <div className="h-full p-4 overflow-hidden">
            <iframe
  ref={iframeRef}
  srcDoc={`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            font-family: 'Open Sans', sans-serif;
          }
          #content-wrapper {
            max-width: 100%;
            margin: 0 auto;
            padding: 0 16px;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div id="content-wrapper"></div>
      </body>
    </html>
  `}
  style={{ width: "100%", height: "100%", border: "none" }}
  title="Preview"
  onLoad={() => updateIframeContent(previewHtmlContent)}
/>
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 transition-colors hover:bg-gray-300" />
          <Panel minSize={20}>
            <div className="flex h-full flex-col overflow-hidden bg-gray-100">
              <div className="flex items-center p-4 bg-gray-200">
                <Switch
                  id="airplane-mode"
                  className="mr-2"
                  checked={isParentMode}
                  onCheckedChange={handleToggleChange}
                />
                <Label htmlFor="parent-mode">Parent Mode</Label>
                <div className="flex items-center ml-6">
                  <Button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="mr-2"
                    size="sm"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleRedo} disabled={!canRedo} size="sm">
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
                <div>{saveStatus}</div>
              </div>

              <div className="flex-1">
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-800 bg-opacity-50">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <MonacoEditor
                  height="100%"
                  language="html"
                  theme="vs-dark"
                  value={
                    isParentMode
                      ? parentContent
                      : currentState.selectedNodeContent
                  }
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  key={editorKey}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    wordWrap: "off",
                  }}
                />
              </div>
            </div>
          </Panel>
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 transform">
            <Input
              className="w-64 rounded-full px-4 py-2 shadow-lg"
              placeholder="Enter a command..."
              value={command}
              onChange={handleCommandChange}
              onKeyPress={handleCommandSubmit}
            />
          </div>
        </PanelGroup>
      </>
    );
  };

export default ProjectEditor;

