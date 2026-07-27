import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['candidate', 'setter', 'admin'], default: 'candidate' },
  isApproved: { type: Boolean, default: false },
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
  lastLoginAt: { type: Date },
  preferences: {
    type: {
      emailNotifications: { type: Boolean, default: true },
      assessmentReminders: { type: Boolean, default: true },
      resultAlerts: { type: Boolean, default: true },
      passwordAlerts: { type: Boolean, default: true },
    },
    default: {},
    select: false,
  },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshToken
  return obj
}

userSchema.index({ role: 1 })

export default mongoose.model('User', userSchema)
