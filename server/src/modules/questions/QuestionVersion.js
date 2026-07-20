import mongoose from 'mongoose'

const questionVersionSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  version: { type: Number, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  changes: { type: String, default: '' },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

questionVersionSchema.index({ question: 1, version: -1 })

export default mongoose.model('QuestionVersion', questionVersionSchema)
