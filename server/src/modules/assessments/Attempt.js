import mongoose from 'mongoose'

const attemptSchema = new mongoose.Schema({
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['in_progress', 'paused', 'completed', 'timed_out', 'auto_submitted', 'abandoned'],
    default: 'in_progress',
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  timeLimit: { type: Number, default: null },
  timeRemaining: { type: Number, default: null },
  totalTimeSpent: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  currentQuestionIndex: { type: Number, default: 0 },
  answeredCount: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  unansweredCount: { type: Number, default: 0 },
  bookmarkedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  violationCount: { type: Number, default: 0 },
  isResumed: { type: Boolean, default: false },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true })

attemptSchema.index({ assessment: 1, user: 1 })
attemptSchema.index({ user: 1, status: 1 })
attemptSchema.index({ assessment: 1, status: 1 })

export default mongoose.model('Attempt', attemptSchema)
