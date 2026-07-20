import mongoose from 'mongoose'

const codingProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalSolved: { type: Number, default: 0 },
  easySolved: { type: Number, default: 0 },
  mediumSolved: { type: Number, default: 0 },
  hardSolved: { type: Number, default: 0 },
  expertSolved: { type: Number, default: 0 },
  totalSubmissions: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  lastSolvedDate: { type: Date, default: null },
  solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  recentlyViewed: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    viewedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true })

export default mongoose.model('CodingProgress', codingProgressSchema)
