import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'

const ACCEPTED_TYPES = '.csv,.json,.xlsx,.xls,.pdf,.docx,.txt,.png,.jpg,.jpeg,.webp'

export default function ImportPage() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const mutation = useMutation({
    mutationFn: (formData) => api.post('/uploads/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => { setTimeout(() => navigate('/question-bank'), 2000) },
  })

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleSelect = (e) => {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  const handleUpload = () => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    mutation.mutate(fd)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/question-bank')} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Import Questions</h2>
          <p className="mt-1 text-sm text-text-secondary">Upload files to bulk import questions</p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-bg-card hover:border-text-tertiary'
        }`}
      >
        <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} onChange={handleSelect} className="hidden" />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="h-10 w-10 text-primary" />
            <p className="text-sm font-medium text-text-primary">{file.name}</p>
            <p className="text-xs text-text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
            <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="text-xs text-danger hover:underline">Remove</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-text-tertiary" />
            <p className="text-sm text-text-primary font-medium">Drop file here or click to browse</p>
            <p className="text-xs text-text-secondary">CSV, JSON, Excel, PDF, DOCX, TXT, Images (max 10MB)</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-2">Supported Formats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> CSV</div>
          <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> JSON</div>
          <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Excel</div>
          <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> PDF</div>
          <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> DOCX</div>
          <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> TXT</div>
          <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> PNG/JPG</div>
        </div>
      </div>

      {mutation.isSuccess && (
        <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success shrink-0" />
          <div>
            <p className="text-sm font-medium text-success">Import Successful</p>
            <p className="text-xs text-text-secondary">{mutation.data?.data?.data?.count || 0} questions imported. Redirecting...</p>
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm text-danger">{mutation.error?.response?.data?.message || 'Import failed'}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate('/question-bank')}>Cancel</Button>
        <Button onClick={handleUpload} disabled={!file || mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {mutation.isPending ? 'Importing...' : 'Import Questions'}
        </Button>
      </div>
    </div>
  )
}
