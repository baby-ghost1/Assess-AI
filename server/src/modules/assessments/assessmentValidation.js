import { z } from 'zod'

const sectionSchema = z.object({
  title: z.string().min(1, 'Section title required'),
  description: z.string().optional().default(''),
  questions: z.array(z.string()).optional().default([]),
  inlineQuestions: z.array(z.any()).optional().default([]),
  totalMarks: z.number().optional().default(0),
  timeLimit: z.number().positive().optional().nullable().default(null),
})

export const createAssessmentSchema = z.object({
  title: z.string().min(2, 'Title required').max(200),
  description: z.string().optional().default(''),
  assessmentType: z.enum(['quiz', 'coding', 'mixed']).default('quiz'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  sections: z.array(sectionSchema).optional().default([]),
  timeLimit: z.number().positive().optional().nullable().default(null),
  passingPercentage: z.number().min(0).max(100).default(40),
  maxAttempts: z.number().positive().default(1),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showResultImmediately: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
  negativeMarking: z.boolean().default(false),
  negativeMarkingValue: z.number().min(0).default(0),
  partialMarking: z.boolean().default(false),
  proctoringRequired: z.boolean().default(false),
  status: z.enum(['draft']).default('draft'),
})

export const updateAssessmentSchema = createAssessmentSchema.partial()

export const adminUpdateAssessmentSchema = createAssessmentSchema.extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
}).partial()

export const startAttemptSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID required'),
})

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.any().nullable().default(null),
  timeSpent: z.number().optional().default(0),
  isBookmarked: z.boolean().optional().default(false),
  notes: z.string().optional().default(''),
})
