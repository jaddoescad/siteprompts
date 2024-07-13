"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import parse, { Element } from "html-react-parser";
import dynamic from "next/dynamic";
import { loader } from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Redo, Undo } from "lucide-react";
import { Loader2 } from "lucide-react"; // Import Loader2 icon
import { Switch } from "@/components/ui/switch"; // Note the capital 'S' in Switch
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
          &lt;{node.name}&gt;
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

  const ProjectEditor: React.FC<ProjectEditorProps> = ({ initialHtmlContent, projectId }) => {
    const [
      htmlContentState,
      {
        set: setHtmlContent,
        reset: resetHtmlContent,
        undo: undoHtmlContent,
        redo: redoHtmlContent,
        canUndo,
        canRedo,
      },
    ] = useUndo(initialHtmlContent);

    const { present: originalHtmlContent } = htmlContentState;
    const [previewHtmlContent, setPreviewHtmlContent] =
      useState(initialHtmlContent);

  const [command, setCommand] = useState("");
  const [selectedNodeContent, setSelectedNodeContent] = useState("");
  const [selectedNodePath, setSelectedNodePath] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParentMode, setIsParentMode] = useState(false);
  const [parentContent, setParentContent] = useState("");

  const [saveStatus, setSaveStatus] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [editorKey, setEditorKey] = useState(0);


  const saveProjectHtmlContent = useCallback(
    debounce(async (content) => {
      setSaveStatus("Saving...");
      try {
        await saveHtmlContent(projectId, content);
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
    setSelectedNodeContent(content);
    const newPath = path.split("-").map(Number);
    setSelectedNodePath(newPath);

    // Apply highlighting immediately
    const newPreviewContent = highlightElementUtil(
      originalHtmlContent,
      newPath
    );
    setPreviewHtmlContent(newPreviewContent);
    setEditorKey(prevKey => prevKey + 1);
  };
  

  useEffect(() => {
    setSelectedNodeContent(originalHtmlContent);
    setParentContent(getParentOrFullElement(originalHtmlContent));
  }, []);

  useEffect(() => {
    if (selectedNodeContent !== "" && !isParentMode) {
      updateHtmlContent(selectedNodeContent);
    }
  }, [selectedNodeContent, isParentMode]);

  const handleEditorChange = (value) => {
    if (isParentMode) {
      const newParentContent = value;
      setParentContent(newParentContent);
      // Update selectedNodeContent when parent is changed
      const newSelectedNodeContent = replaceParent(
        newParentContent,
        selectedNodeContent
      );
      setSelectedNodeContent(newSelectedNodeContent);
      // Update the HTML content
      updateHtmlContent(newSelectedNodeContent);
    } else {
      setSelectedNodeContent(value);
    }
  };

  const handleToggleChange = (checked) => {
    setIsParentMode(checked);
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const updateSelectedNodeContent = useCallback(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHtmlContent, "text/html");

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
        console.error("Invalid path");
        return;
      }
    }

    if (currentElement) {
      const newSelectedContent = currentElement.outerHTML;
      setSelectedNodeContent(newSelectedContent);
      setParentContent(getParentOrFullElement(originalHtmlContent, selectedNodePath));
    }
  }, [originalHtmlContent, selectedNodePath]);


  const updateHtmlContent = useCallback(
    (newContent: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(originalHtmlContent, "text/html");
  
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
          console.error("Invalid path");
          return;
        }
      }
  
      if (currentElement) {
        currentElement.outerHTML = newContent;
        const newOriginalContent = doc.body.innerHTML;
        setHtmlContent(newOriginalContent);
  
        // Apply highlighting to the updated content
        const newPreviewContent = highlightElementUtil(
          newOriginalContent,
          selectedNodePath
        );
        setPreviewHtmlContent(newPreviewContent);
        console.log("Updated content:");
        if (!isInitialLoad) {
          saveProjectHtmlContent(newOriginalContent);
          setIsInitialLoad(false);
        }
      }
    },
    [originalHtmlContent, selectedNodePath, setHtmlContent, saveProjectHtmlContent, isInitialLoad]
  );

  useEffect(() => {
    setPreviewHtmlContent(originalHtmlContent);
  }, [originalHtmlContent]);

  const handleUndo = useCallback(() => {
    undoHtmlContent();
    updateSelectedNodeContent();
  }, [undoHtmlContent, updateSelectedNodeContent]);

  const handleRedo = useCallback(() => {
    redoHtmlContent();
    updateSelectedNodeContent();
  }, [redoHtmlContent, updateSelectedNodeContent]);

  const handleCommandChange = (e) => {
    setCommand(e.target.value);
  };

  const handleCommandSubmit = useCallback(
    async (e) => {
      if (e.key === "Enter") {
        setIsLoading(true);
        try {
          const response = await fetch("/api/claude", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: isParentMode ? parentContent : selectedNodeContent,
              userInstruction: command,
            }),
          });

          if (!response.ok) {
            throw new Error("API request failed");
          }

          const result = await response.text();

          // Update the editor with Claude's analysis
          if (editorRef.current) {
            editorRef.current.setValue(result);
          }

          // Update the selected node content and HTML content
          if (isParentMode) {
            setParentContent(result);
            const newSelectedNodeContent = replaceParent(
              result,
              selectedNodeContent
            );
            setSelectedNodeContent(newSelectedNodeContent);
            updateHtmlContent(newSelectedNodeContent);
          } else {
            setSelectedNodeContent(result);
            updateHtmlContent(result);
          }
        } catch (error) {
          console.error("Error calling Claude API:", error);
          if (editorRef.current) {
            editorRef.current.setValue(
              "An error occurred while processing your request."
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
          <div className="h-full p-4 overflow-scroll">
            {parse(previewHtmlContent)}
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
              <div className="flex items-center">
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
                value={isParentMode ? parentContent : selectedNodeContent}
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
