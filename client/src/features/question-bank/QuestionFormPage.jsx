import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Save, ArrowLeft, Plus, X, Check, Tag } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

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
    isCorrect: z.boolean().optional().default(false),
  })).optional().default([]),
  correctAnswer: z.any().optional(),
})

export default function QuestionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const [tagSearch, setTagSearch] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const tagDropdownRef = useRef(null)

  const { data: questionData } = useQuery({
    queryKey: ['question', id],
    queryFn: () => api.get(`/questions/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags', tagSearch],
    queryFn: () => api.get(`/tags?search=${tagSearch}&limit=50`).then((r) => r.data),
  })

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: '', description: '', questionType: 'single_correct', difficulty: 'medium',
      marks: 1, negativeMarks: 0, category: '', tags: [],
      options: [
        { text: '', key: 'A', isCorrect: false }, { text: '', key: 'B', isCorrect: false },
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
      options: questionData.data.options?.map((o) => ({ ...o, isCorrect: o.isCorrect || false })) || [],
    } : undefined,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'options' })
  const questionType = watch('questionType')
  const hasOptions = ['single_correct', 'multi_correct', 'true_false'].includes(questionType)
  const selectedTags = watch('tags') || []

  useEffect(() => {
    function handleClickOutside(e) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setShowTagDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      if (questionType === 'single_correct' || questionType === 'true_false') {
        const correct = data.options.find((o) => o.isCorrect)
        data.correctAnswer = correct ? correct.key : null
      } else if (questionType === 'multi_correct') {
        data.correctAnswer = data.options.filter((o) => o.isCorrect).map((o) => o.key)
      }
    } else {
      data.options = []
    }
    mutation.mutate(data)
  }

  const addOption = () => {
    const keys = ['A', 'B', 'C', 'D', 'E', 'F']
    if (fields.length < 6) {
      append({ text: '', key: keys[fields.length], isCorrect: false })
    }
  }

  const toggleTag = (tagId) => {
    const current = selectedTags
    if (current.includes(tagId)) {
      setValue('tags', current.filter((t) => t !== tagId), { shouldValidate: true })
    } else {
      setValue('tags', [...current, tagId], { shouldValidate: true })
    }
  }

  const availableTags = tagsData?.data || []

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

        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-text-secondary" />
            <h3 className="text-base font-semibold text-text-primary">Tags</h3>
          </div>
          <div className="relative" ref={tagDropdownRef}>
            <input
              value={tagSearch}
              onChange={(e) => { setTagSearch(e.target.value); setShowTagDropdown(true) }}
              onFocus={() => setShowTagDropdown(true)}
              className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search tags..."
            />
            {showTagDropdown && availableTags.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-bg-card shadow-xl">
                {availableTags.map((tag) => (
                  <button
                    key={tag._id}
                    type="button"
                    onClick={() => { toggleTag(tag._id); setTagSearch(''); setShowTagDropdown(false) }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="flex-1 text-left">{tag.name}</span>
                    {selectedTags.includes(tag._id) && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableTags.filter((t) => selectedTags.includes(t._id)).map((tag) => (
                <span key={tag._id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                  <button type="button" onClick={() => toggleTag(tag._id)} className="ml-0.5 hover:text-primary/70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {hasOptions && (
          <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Options</h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {questionType === 'multi_correct' ? 'Select all correct answers' : 'Select the correct answer'}
                </p>
              </div>
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
                <label className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2 cursor-pointer hover:bg-bg-tertiary transition-colors shrink-0">
                  <input
                    type={questionType === 'multi_correct' ? 'checkbox' : 'radio'}
                    name={questionType === 'multi_correct' ? undefined : 'correctAnswer'}
                    checked={field.isCorrect || false}
                    onChange={() => {
                      if (questionType === 'multi_correct') {
                        const currentOpts = watch('options')
                        const updated = currentOpts.map((o, i) => i === index ? { ...o, isCorrect: !o.isCorrect } : o)
                        setValue('options', updated)
                      } else {
                        const currentOpts = watch('options')
                        const updated = currentOpts.map((o, i) => ({ ...o, isCorrect: i === index }))
                        setValue('options', updated)
                      }
                    }}
                    className="accent-primary"
                  />
                  <span className="text-xs text-text-secondary whitespace-nowrap">Correct</span>
                </label>
                {fields.length > 2 && (
                  <button type="button" onClick={() => remove(index)} className="p-2 text-text-tertiary hover:text-danger transition-colors shrink-0">
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
