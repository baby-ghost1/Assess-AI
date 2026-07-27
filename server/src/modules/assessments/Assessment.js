import mongoose from 'mongoose'

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  totalMarks: { type: Number, default: 0 },
  timeLimit: { type: Number, default: null },
}, { _id: true })

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assessmentType: {
    type: String,
    enum: ['quiz', 'coding', 'mixed'],
    default: 'quiz',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
  },
  sections: [sectionSchema],
  timeLimit: { type: Number, default: null },
  passingPercentage: { type: Number, default: 40 },
  maxAttempts: { type: Number, default: 1 },
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: false },
  showResultImmediately: { type: Boolean, default: true },
  showCorrectAnswers: { type: Boolean, default: true },
  negativeMarking: { type: Boolean, default: false },
  negativeMarkingValue: { type: Number, default: 0 },
  partialMarking: { type: Boolean, default: false },
  proctoringRequired: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'published', 'archived'],
    default: 'draft',
  },
  rejectionReason: { type: String, default: '' },
  questionStatus: {
    type: Map,
    of: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
    },
    default: {},
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  isAiGenerated: { type: Boolean, default: false },
  aiQuizConfig: {
    timerType: { type: String, enum: ['overall', 'per_question'], default: 'overall' },
    perQuestionTime: { type: Number, default: null },
    questionTypes: [{ type: String }],
    aiProvider: { type: String },
  },
}, { timestamps: true })

assessmentSchema.index({ status: 1, createdBy: 1 })
assessmentSchema.index({ title: 'text', description: 'text' })

export default mongoose.model('Assessment', assessmentSchema)
