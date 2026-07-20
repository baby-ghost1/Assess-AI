import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema({
  attempt: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt', required: true },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answer: { type: mongoose.Schema.Types.Mixed, default: null },
  isCorrect: { type: Boolean, default: false },
  marksObtained: { type: Number, default: 0 },
  marksAwarded: { type: Number, default: 0 },
  negativeMarks: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  isAnswered: { type: Boolean, default: false },
  isBookmarked: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true })

submissionSchema.index({ attempt: 1, question: 1 }, { unique: true })
submissionSchema.index({ attempt: 1 })
submissionSchema.index({ user: 1, assessment: 1 })

export default mongoose.model('Submission', submissionSchema)
