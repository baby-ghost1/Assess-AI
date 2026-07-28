import { z } from 'zod'

const allowedLanguages = ['javascript', 'python', 'cpp', 'java', 'c', 'js', 'py', 'c++']

export const runCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50000, 'Code too large'),
  language: z.string().refine(l => allowedLanguages.includes(l.toLowerCase()), {
    message: `Language must be one of: ${allowedLanguages.join(', ')}`,
  }),
  questionId: z.string().min(1, 'Question ID required').max(100),
})

export const submitCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50000, 'Code too large'),
  language: z.string().refine(l => allowedLanguages.includes(l.toLowerCase()), {
    message: `Language must be one of: ${allowedLanguages.join(', ')}`,
  }),
  questionId: z.string().min(1, 'Question ID required').max(100),
})

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment content required').max(2000, 'Comment too long'),
  parentComment: z.string().max(100).optional().nullable(),
})
