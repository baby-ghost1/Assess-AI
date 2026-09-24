import { z } from 'zod'

const sectionSchema = z.object({
  title: z.string().min(1, 'Section title required'),
  description: z.string().optional().default(''),
  questions: z.array(z.string()).optional().default([]),
  inlineQuestions: z.array(z.any()).optional().default([]),
  totalMarks: z.number().optional().default(0),
  timeLimit: z.number().positive().optional().nullable().default(null),
})

const candidateEntrySchema = z.object({
  email: z.string().email('Valid email required'),
  name: z.string().optional().default(''),
})

export const createAssessmentSchema = z.object({
  title: z.string().min(2, 'Title required').max(200),
  description: z.string().optional().default(''),
  assessmentType: z.enum(['quiz', 'coding', 'mixed']).default('quiz'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  sections: z.array(sectionSchema).optional().default([]),
  // Optional so the service can fall back to admin settings when omitted
  timeLimit: z.number().positive().optional().nullable(),
  passingPercentage: z.number().min(0).max(100).optional(),
  maxAttempts: z.number().positive().optional(),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showResultImmediately: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
  negativeMarking: z.boolean().default(false),
  negativeMarkingValue: z.number().min(0).default(0),
  partialMarking: z.boolean().default(false),
  proctoringRequired: z.boolean().default(false),
  accessMode: z.enum(['open', 'restricted']).default('open'),
  candidateList: z.array(candidateEntrySchema).optional().default([]),
  sharedPassword: z.string().optional().default(''),
  status: z.enum(['draft']).default('draft'),
})

export const updateAssessmentSchema = createAssessmentSchema.partial()

export const adminUpdateAssessmentSchema = createAssessmentSchema.extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
}).partial()

export const startAttemptSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID required'),
})

export const restrictedStartSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID required'),
  candidateEmail: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})

const objectIdRegEx = /^[0-9a-fA-F]{24}$/

export const submitAnswerSchema = z.object({
  questionId: z.string().regex(objectIdRegEx, 'Invalid question id'),
  answer: z.any().nullable().default(null),
  timeSpent: z.number().optional().default(0),
  isBookmarked: z.boolean().optional().default(false),
  notes: z.string().optional().default(''),
})

export const releaseResultsSchema = z.object({})

export const grantRetakeSchema = z.object({
  userId: z.string().min(1, 'Candidate userId required'),
})

export const finishAttemptSchema = z.object({
  reason: z.enum(['manual', 'timeout', 'auto_submit']).optional().default('manual'),
}).optional().default({ reason: 'manual' })
