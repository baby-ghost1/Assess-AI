import mongoose from 'mongoose'

const codingCommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingComment', default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
}, { timestamps: true })

codingCommentSchema.index({ question: 1, createdAt: -1 })
codingCommentSchema.index({ user: 1 })

export default mongoose.model('CodingComment', codingCommentSchema)
