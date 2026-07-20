import mongoose from 'mongoose'

const violationSchema = new mongoose.Schema({
  attempt: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  type: {
    type: String,
    enum: [
      'tab_switch', 'multiple_faces', 'no_face', 'phone_detected',
      'looking_away', 'background_noise', 'clipboard_usage',
      'keyboard_shortcut', 'network_disconnect', 'fullscreen_exit',
      'copy_paste', 'right_click', 'face_not_centered',
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  details: { type: String, default: '' },
  screenshot: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

violationSchema.index({ attempt: 1, timestamp: -1 })
violationSchema.index({ user: 1 })
violationSchema.index({ type: 1 })

export default mongoose.model('ProctoringViolation', violationSchema)
