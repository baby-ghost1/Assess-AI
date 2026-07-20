import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Save, ArrowLeft, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

const questionFormSchema = z.object({
  title: z.string().min(2, 'Title required'),
  description: z.string().optional().default(''),
  questionType: z.enum(['single_correct', 'multi_correct', 'true_false', 'fill_blanks', 'coding', 'subjective']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  marks: z.coerce.number().positive().default(1),
  negativeMarks: z.coerce.number().min(0).default(0),
  category: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  options: z.array(z.object({
    text: z.string().min(1, 'Option required'),
    key: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  })).optional().default([]),
  correctAnswer: z.any().optional(),
})

export default function QuestionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const [showOptions, setShowOptions] = useState(true)

  const { data: questionData } = useQuery({
    queryKey: ['question', id],
    queryFn: () => api.get(`/questions/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: '', description: '', questionType: 'single_correct', difficulty: 'medium',
      marks: 1, negativeMarks: 0, category: '', tags: [],
      options: [
        { text: '', key: 'A' }, { text: '', key: 'B' },
      ],
    },
    values: isEdit && questionData?.data ? {
      title: questionData.data.title,
      description: questionData.data.description || '',
      questionType: questionData.data.questionType,
      difficulty: questionData.data.difficulty,
      marks: questionData.data.marks,
      negativeMarks: questionData.data.negativeMarks,
      category: questionData.data.category || '',
      tags: questionData.data.tags?.map((t) => t._id) || [],
      options: questionData.data.options || [],
    } : undefined,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'options' })
  const questionType = watch('questionType')
  const hasOptions = ['single_correct', 'multi_correct', 'true_false'].includes(questionType)

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/questions/${id}`, data) : api.post('/questions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      navigate('/question-bank')
    },
  })

  const onSubmit = (data) => {
    if (hasOptions) {
      data.options = data.options.filter((o) => o.text.trim())
    } else {
      data.options = []
    }
    mutation.mutate(data)
  }

  const addOption = () => {
    const keys = ['A', 'B', 'C', 'D', 'E', 'F']
    if (fields.length < 6) {
      append({ text: '', key: keys[fields.length] })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/question-bank')} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">{isEdit ? 'Edit Question' : 'Create Question'}</h2>
          <p className="mt-1 text-sm text-text-secondary">{isEdit ? 'Update question details' : 'Add a new question to the bank'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Question Title *</label>
            <input {...register('title')} className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g. What is the capital of France?" />
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" placeholder="Additional context or instructions..." />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Type *</label>
              <select {...register('questionType')} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="single_correct">Single Correct</option>
                <option value="multi_correct">Multi Correct</option>
                <option value="true_false">True/False</option>
                <option value="fill_blanks">Fill Blanks</option>
                <option value="coding">Coding</option>
                <option value="subjective">Subjective</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Difficulty</label>
              <select {...register('difficulty')} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Marks</label>
              <input type="number" {...register('marks')} className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Negative Marks</label>
              <input type="number" {...register('negativeMarks')} className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
            <input {...register('category')} className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. JavaScript, Data Structures, General" />
          </div>
        </div>

        {hasOptions && (
          <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">Options</h3>
              {fields.length < 6 && (
                <Button type="button" variant="secondary" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4" /> Add Option
                </Button>
              )}
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-tertiary text-sm font-medium text-text-secondary shrink-0">
                  {field.key}
                </div>
                <div className="flex-1">
                  <input {...register(`options.${index}.text`)} className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary" placeholder={`Option ${field.key}`} />
                </div>
                {fields.length > 2 && (
                  <button type="button" onClick={() => remove(index)} className="p-2 text-text-tertiary hover:text-danger transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/question-bank')}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            <Save className="h-4 w-4" /> {mutation.isPending ? 'Saving...' : isEdit ? 'Update Question' : 'Create Question'}
          </Button>
        </div>
      </form>
    </div>
  )
}
