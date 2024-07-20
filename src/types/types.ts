export interface ProjectEditorProps {
    initialHtmlContent: string;
    projectId: string;
  }

  export interface EditorState {
    htmlContent: string;
    selectedNodeContent: string;
    selectedNodePath: number[];
  }