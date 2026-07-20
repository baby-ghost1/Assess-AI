import mongoose from 'mongoose'

const codingSubmissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  results: [{
    input: String,
    expected: String,
    actual: String,
    passed: Boolean,
    error: String,
    executionTime: Number,
    memoryUsed: Number,
  }],
  passed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  allPassed: { type: Boolean, default: false },
  executionTime: { type: Number, default: 0 },
  memoryUsed: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'wrong_answer', 'error', 'timeout'], default: 'pending' },
}, { timestamps: true })

codingSubmissionSchema.index({ user: 1, question: 1 })
codingSubmissionSchema.index({ user: 1, createdAt: -1 })
codingSubmissionSchema.index({ question: 1, allPassed: -1 })

export default mongoose.model('CodingSubmission', codingSubmissionSchema)
