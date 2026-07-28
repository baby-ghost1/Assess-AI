import { useState, useRef, useCallback } from 'react'
import { Code, RotateCcw, WrapText, Undo2, Minus, Plus, Lock } from 'lucide-react'
import { Button } from '@/components/ui'
import Editor from '@monaco-editor/react'

export default function CodeEditorPanel({ language, code, onChange, onLanguageChange, onReset, fontSize, onFontSizeChange, editorTheme, languages }) {
  const editorRef = useRef(null)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })

  const handleMount = useCallback((editor) => {
    editorRef.current = editor
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column })
    })
  }, [])

  const handleFormat = useCallback(() => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run()
  }, [])

  const handleUndo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'undo')
  }, [])

  return (
    <div className="flex flex-col h-full bg-bg-card">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Code className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-text-primary">Code</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onReset} variant="ghost" size="sm" className="h-6 px-1.5 py-0" title="Reset code">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs text-text-tertiary">Ln {cursorPos.line}, Col {cursorPos.col}</span>
        </div>
      </div>

      {/* Language selector row */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <select value={language} onChange={(e) => onLanguageChange(e.target.value)}
            className="text-xs font-medium bg-transparent border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer dark:bg-[#1e1e1e] dark:text-white">
            {languages.map(l => <option key={l.id} value={l.id} className="dark:bg-[#1e1e1e] dark:text-white">{l.label}</option>)}
          </select>
          <div className="flex items-center gap-1 text-xs text-text-tertiary">
            <Lock className="h-3 w-3" />
            <span>Auto</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={handleFormat} className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors" title="Format code">
            <WrapText className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleUndo} className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors" title="Undo">
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-0.5 ml-1 border border-border rounded">
            <button onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))} className="p-1 text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary rounded-l transition-colors"><Minus className="h-3 w-3" /></button>
            <span className="text-[10px] text-text-tertiary min-w-[2rem] text-center">{fontSize}px</span>
            <button onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))} className="p-1 text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary rounded-r transition-colors"><Plus className="h-3 w-3" /></button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={languages.find(l => l.id === language)?.monaco || 'javascript'}
          value={code}
          onChange={(val) => onChange(val || '')}
          theme={editorTheme}
          onMount={handleMount}
          options={{
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            suggestOnTriggerCharacters: false,
            renderWhitespace: 'selection',
            tabSize: 4,
            bracketPairColorization: { enabled: true },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
        />
      </div>

      {/* Editor Footer */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border shrink-0">
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span>Saved to local storage</span>
        </div>
        <span className="text-xs text-text-tertiary font-mono">Ln {cursorPos.line}, Col {cursorPos.col}</span>
      </div>
    </div>
  )
}
