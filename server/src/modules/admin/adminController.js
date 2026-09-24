import * as adminService from './adminService.js'
import { getIO, disconnectUserSockets } from '../../config/socket.js'
import { getProctoringSettings } from '../settings/settingsService.js'

// ─── Users ──────────────────────────────────────────────

export async function listUsers(req, res, next) {
  try {
    const data = await adminService.listUsers(req.query)
    res.json({ success: true, data, message: 'Users fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getUserById(req, res, next) {
  try {
    const data = await adminService.getUserById(req.params.id)
    res.json({ success: true, data, message: 'User fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function updateUser(req, res, next) {
  try {
    const data = await adminService.updateUser(req.params.id, req.validatedBody)
    if (req.validatedBody?.isActive === false) {
      disconnectUserSockets(req.params.id)
    }
    res.json({ success: true, data, message: 'User updated', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function deleteUser(req, res, next) {
  try {
    await adminService.deleteUser(req.params.id, req.validatedBody.reason, req.user._id)
    disconnectUserSockets(req.params.id)
    res.json({ success: true, data: null, message: 'User deleted', errors: null, meta: null })
  } catch (error) { next(error) }
}

// ─── Roles ──────────────────────────────────────────────

export async function listRoles(req, res, next) {
  try {
    const data = adminService.listRoles()
    res.json({ success: true, data, message: 'Roles fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

// ─── Settings ───────────────────────────────────────────

export async function getSettings(req, res, next) {
  try {
    const data = await adminService.getSettings(req.query.category)
    res.json({ success: true, data, message: 'Settings fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function updateSetting(req, res, next) {
  try {
    const data = await adminService.updateSetting(req.params.key, req.validatedBody.value, req.user._id)
    // Broadcast full proctoring settings whenever any proctoring key changes
    if (req.params.key === 'enable_proctoring' || req.params.key.startsWith('proctoring_')) {
      const io = getIO()
      if (io) {
        const settings = await getProctoringSettings()
        io.emit('proctoring:settings-changed', settings)
      }
    }
    res.json({ success: true, data, message: 'Setting updated', errors: null, meta: null })
  } catch (error) { next(error) }
}

// ─── Platform Stats ─────────────────────────────────────

export async function getPlatformStats(req, res, next) {
  try {
    const data = await adminService.getPlatformStats()
    res.json({ success: true, data, message: 'Platform stats fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getSystemHealth(req, res, next) {
  try {
    const data = await adminService.getSystemHealth()
    res.json({ success: true, data, message: 'System health fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function deleteAllData(req, res, next) {
  try {
    const { confirmation, password } = req.validatedBody
    const data = await adminService.deleteAllData(req.user._id, confirmation, password)
    res.json({ success: true, data: null, message: data.message, errors: null, meta: null })
  } catch (error) { next(error) }
}
