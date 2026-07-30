import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['delete_account'], required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true })

otpSchema.index({ user: 1, purpose: 1 })
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Otp', otpSchema)
