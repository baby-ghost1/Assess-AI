import { Router } from 'express'
import { getSettingValue } from './settingsService.js'

const router = Router()

// Public, unauthenticated settings consumed by the client shell
// (branding, registration toggle). Never expose secrets or admin-only values.
router.get('/public', async (req, res) => {
  try {
    const [siteName, siteDescription, registrationEnabled] = await Promise.all([
      getSettingValue('site_name'),
      getSettingValue('site_description'),
      getSettingValue('enable_registration'),
    ])
    res.json({
      success: true,
      data: {
        siteName: siteName || 'AssessAI',
        siteDescription: siteDescription || 'AI-Powered Assessment Platform',
        registrationEnabled: registrationEnabled !== false,
      },
      message: 'Public settings fetched',
      errors: null,
      meta: null,
    })
  } catch (err) {
    res.json({
      success: true,
      data: {
        siteName: 'AssessAI',
        siteDescription: 'AI-Powered Assessment Platform',
        registrationEnabled: true,
      },
      message: 'Public settings fetched',
      errors: null,
      meta: null,
    })
  }
})

export default router
