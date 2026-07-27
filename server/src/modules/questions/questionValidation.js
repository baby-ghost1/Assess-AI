import { z } from 'zod'

const optionSchema = z.object({
  text: z.string().min(1, 'Option text required'),
  key: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  isCorrect: z.boolean().optional().default(false),
})

const codingTestCaseSchema = z.object({
  input: z.string().optional().default(''),
  output: z.string().min(1, 'Test case output required'),
  isHidden: z.boolean().optional().default(false),
  description: z.string().optional().default(''),
})

const baseQuestionSchema = {
  title: z.string().min(2, 'Title must be at least 2 characters').max(500),
  description: z.string().optional().default(''),
  questionType: z.enum(['single_correct', 'multi_correct', 'true_false', 'fill_blanks', 'coding', 'subjective']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional().default('medium'),
  tags: z.array(z.string()).optional().default([]),
  category: z.string().optional().default(''),
  marks: z.number().positive().optional().default(1),
  negativeMarks: z.number().min(0).optional().default(0),
  timeLimit: z.number().positive().optional().nullable().default(null),
}

export const createQuestionSchema = z.object({
  ...baseQuestionSchema,
  options: z.array(optionSchema).optional().default([]),
  correctAnswer: z.any().optional().nullable().default(null),
  codingDetails: z.object({
    language: z.string().optional().default(''),
    starterCode: z.string().optional().default(''),
    testCases: z.array(codingTestCaseSchema).optional().default([]),
    timeLimit: z.number().optional().default(5000),
    memoryLimit: z.number().optional().default(256),
  }).optional().nullable().default(null),
}).refine((data) => {
  if (['single_correct', 'multi_correct', 'true_false'].includes(data.questionType)) {
    return data.options.length >= 2
  }
  return true
}, { message: 'At least 2 options required for MCQ type', path: ['options'] })

export const updateQuestionSchema = z.object({
  ...baseQuestionSchema,
  options: z.array(optionSchema).optional().default([]),
  correctAnswer: z.any().optional().nullable().default(null),
  codingDetails: z.object({
    language: z.string().optional().default(''),
    starterCode: z.string().optional().default(''),
    testCases: z.array(codingTestCaseSchema).optional().default([]),
    timeLimit: z.number().optional().default(5000),
    memoryLimit: z.number().optional().default(256),
  }).optional().nullable().default(null),
}).partial()

export const questionFilterSchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(20),
  search: z.string().optional(),
  questionType: z.string().optional(),
  difficulty: z.string().optional(),
  status: z.string().optional(),
  tags: z.string().optional(),
  category: z.string().optional(),
  createdBy: z.string().optional(),
  sort: z.string().optional().default('-createdAt'),
})
