import mongoose from 'mongoose'

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
  key: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F'], required: true },
}, { _id: false })

const codingTestCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  output: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
  description: { type: String, default: '' },
}, { _id: false })

const codingHintSchema = new mongoose.Schema({
  content: { type: String, required: true },
  cost: { type: Number, default: 0 },
}, { _id: false })

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  questionType: {
    type: String,
    enum: ['single_correct', 'multi_correct', 'true_false', 'fill_blanks', 'coding', 'subjective'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
  },
  options: [optionSchema],
  correctAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
  codingDetails: {
    language: { type: String, default: '' },
    starterCode: { type: String, default: '' },
    starterCodes: { type: Map, of: String, default: {} },
    harnesses: { type: Map, of: String, default: {} },
    testCases: [codingTestCaseSchema],
    hints: [codingHintSchema],
    solution: { type: String, default: '' },
    constraints: [{ type: String }],
    companies: [{ type: String }],
    topics: [{ type: String }],
    similarQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    timeLimit: { type: Number, default: 5000 },
    memoryLimit: { type: Number, default: 256 },
    acceptanceRate: { type: Number, default: 0 },
    totalAccepted: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    discussionCount: { type: Number, default: 0 },
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  category: { type: String, default: '' },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  timeLimit: { type: Number, default: null },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'rejected', 'archived'],
    default: 'draft',
  },
  rejectionReason: { type: String, default: '' },
  version: { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: {
    type: String,
    enum: ['manual', 'ai_generated', 'imported'],
    default: 'manual',
  },
  aiModel: { type: String, default: '' },
  isAiGenerated: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 },
}, { timestamps: true })

questionSchema.index({ title: 'text', description: 'text' })
questionSchema.index({ questionType: 1, difficulty: 1 })
questionSchema.index({ status: 1, createdBy: 1 })
questionSchema.index({ tags: 1 })
questionSchema.index({ category: 1 })

export default mongoose.model('Question', questionSchema)
