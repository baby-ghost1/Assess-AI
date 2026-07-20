import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['general', 'security', 'assessment', 'ai', 'email', 'proctoring'], default: 'general' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

settingsSchema.index({ category: 1 })

export default mongoose.model('Settings', settingsSchema)
