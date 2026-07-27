import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ImportForm } from '@/features/assessments/AssessmentCreatePage'

export default function ImportPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/question-bank')} className="rounded-xl p-2.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Import Questions</h2>
          <p className="mt-0.5 text-sm text-text-secondary">Upload a document and AI will generate questions from its content</p>
        </div>
      </div>

      <ImportForm
        endpoint="/ai/import-assessment"
        onSuccess={(a) => navigate(`/assessments/${a._id}/preview`)}
      />
    </div>
  )
}
