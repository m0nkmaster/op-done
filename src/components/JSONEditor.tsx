import { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface JSONEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidationError?: (errors: string[]) => void;
  height?: string;
}

export function JSONEditor({ value, onChange, onValidationError, height = '600px' }: JSONEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure JSON language options
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: false,
    });

    // Listen for validation errors
    monaco.editor.onDidChangeMarkers(() => {
      if (!editorRef.current) return;

      const model = editorRef.current.getModel();
      if (!model) return;

      const markers = monaco.editor.getModelMarkers({ resource: model.uri });
      const errors = markers
        .filter(marker => marker.severity === monaco.MarkerSeverity.Error)
        .map(marker => marker.message);

      if (onValidationError) {
        onValidationError(errors);
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  useEffect(() => {
    // Update editor value when prop changes (for external updates)
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [value]);

  return (
    <Editor
      height={height}
      defaultLanguage="json"
      value={value}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
}
