import mongoose from 'mongoose'

const codingBookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
}, { timestamps: true })

codingBookmarkSchema.index({ user: 1, question: 1 }, { unique: true })

export default mongoose.model('CodingBookmark', codingBookmarkSchema)
