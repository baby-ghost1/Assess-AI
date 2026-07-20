import mongoose from 'mongoose'

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#6366F1' },
  usageCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

tagSchema.index({ name: 1 })

export default mongoose.model('Tag', tagSchema)
