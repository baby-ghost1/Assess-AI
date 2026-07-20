import { useState } from 'react'
import { CheckCircle, XCircle, Terminal, Clock, Cpu, Loader2 } from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function formatMs(ms) {
  if (!ms) return '0ms'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export default function TestResultsPanel({ results, running, consoleOutput }) {
  const [tab, setTab] = useState('testcase')
  const [activeCase, setActiveCase] = useState(0)
  const current = results?.[activeCase]
  const passedCount = results?.filter(r => r.passed).length || 0
  const totalCount = results?.length || 0
  const allPassed = results && passedCount === totalCount && totalCount > 0

  return (
    <div className="flex flex-col h-full bg-bg-card">
      <div className="flex items-center gap-0 px-4 border-b border-border shrink-0">
        <button onClick={() => setTab('testcase')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === 'testcase' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}>
          <CheckCircle className="h-3.5 w-3.5" /> Testcase
        </button>
        <button onClick={() => setTab('result')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === 'result' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}>
          <Terminal className="h-3.5 w-3.5" /> Test Result
          {results && <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${allPassed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{passedCount}/{totalCount}</span>}
        </button>
        <button onClick={() => setTab('console')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === 'console' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}>
          <Terminal className="h-3.5 w-3.5" /> Console
          {consoleOutput && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {running ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Running test cases...</span>
          </div>
        ) : tab === 'testcase' ? (
          <div className="flex flex-col h-full">
            {results && results.length > 0 ? (
              <>
                <div className="flex items-center gap-1 px-4 py-2 border-b border-border shrink-0 overflow-x-auto">
                  {results.map((r, i) => (
                    <button key={i} onClick={() => setActiveCase(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                        activeCase === i ? 'bg-bg-tertiary text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
                      }`}>
                      {r.passed ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                      Case {i + 1}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {current && (
                    <>
                      <div className="rounded-lg bg-bg-tertiary/50 p-3">
                        <p className="text-[11px] text-text-tertiary font-medium mb-1">Input:</p>
                        <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap">{current.input || '(no input)'}</pre>
                      </div>
                      <div className="rounded-lg bg-bg-tertiary/50 p-3">
                        <p className="text-[11px] text-text-tertiary font-medium mb-1">Output (Your result):</p>
                        <pre className={`text-xs font-mono whitespace-pre-wrap ${current.passed ? 'text-emerald-500' : 'text-red-500'}`}>{current.actual || '(no output)'}</pre>
                      </div>
                      <div className="rounded-lg bg-bg-tertiary/50 p-3">
                        <p className="text-[11px] text-text-tertiary font-medium mb-1">Expected:</p>
                        <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap">{current.expected}</pre>
                      </div>
                      {current.description && (
                        <div className="rounded-lg bg-bg-tertiary/50 p-3">
                          <p className="text-[11px] text-text-tertiary font-medium mb-1">Description:</p>
                          <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">{current.description}</pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                <p className="text-sm">You must run your code first</p>
              </div>
            )}
          </div>
        ) : tab === 'console' ? (
          <div className="flex flex-col h-full">
            {consoleOutput ? (
              <div className="flex-1 overflow-y-auto p-4">
                <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap leading-relaxed">{consoleOutput}</pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                <div className="text-center space-y-2">
                  <Terminal className="h-6 w-6 mx-auto opacity-30" />
                  <p className="text-sm">Run your code to see console output</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {results && results.length > 0 ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {results.map((r, i) => (
                    <div key={i} className={`rounded-lg border overflow-hidden ${r.passed ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                      <div className={`flex items-center justify-between px-3 py-2 ${r.passed ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                        <div className="flex items-center gap-2">
                          {r.passed ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                          <span className={`text-xs font-medium ${r.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                            Case {i + 1}: {r.passed ? 'Accepted' : 'Wrong Answer'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
                          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {formatMs(r.executionTime)}</span>
                          <span className="flex items-center gap-1"><Cpu className="h-2.5 w-2.5" /> {formatBytes(r.memoryUsed)}</span>
                        </div>
                      </div>
                      <div className="p-3 space-y-2 bg-bg-card">
                        <div>
                          <p className="text-[10px] text-text-tertiary font-medium mb-0.5">Input:</p>
                          <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap bg-bg-tertiary/30 rounded p-2">{r.input || '(no input)'}</pre>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-tertiary font-medium mb-0.5">Output:</p>
                          <pre className={`text-xs font-mono whitespace-pre-wrap rounded p-2 ${r.passed ? 'text-emerald-500 bg-emerald-500/5' : 'text-red-500 bg-red-500/5'}`}>{r.actual || '(no output)'}</pre>
                        </div>
                        {!r.passed && (
                          <div>
                            <p className="text-[10px] text-text-tertiary font-medium mb-0.5">Expected:</p>
                            <pre className="text-xs text-emerald-500 font-mono whitespace-pre-wrap bg-emerald-500/5 rounded p-2">{r.expected}</pre>
                          </div>
                        )}
                        {r.error && (
                          <div>
                            <p className="text-[10px] text-text-tertiary font-medium mb-0.5">Error:</p>
                            <pre className="text-xs text-red-500 font-mono whitespace-pre-wrap bg-red-500/5 rounded p-2">{r.error}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`flex items-center justify-between text-xs px-4 py-2.5 border-t border-border shrink-0 ${allPassed ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                  <div className={`flex items-center gap-2 font-medium ${allPassed ? 'text-emerald-500' : 'text-red-500'}`}>
                    {allPassed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {allPassed ? 'All test cases passed' : `${totalCount - passedCount} test case(s) failed`}
                  </div>
                  <span className={allPassed ? 'text-emerald-500' : 'text-text-secondary'}>
                    {passedCount}/{totalCount} passed
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                <p className="text-sm">Test results will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
