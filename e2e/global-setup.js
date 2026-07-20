import { request } from '@playwright/test'

const API = 'http://127.0.0.1:5000/api/v1'

export default async function globalSetup() {
  const ctx = await request.newContext()

  const adminRes = await ctx.post(`${API}/auth/admin/login`, { data: { email: 'admin@assessai.com', password: 'Admin@123456' } })
  const adminBody = await adminRes.json()
  if (!adminBody.success) throw new Error(`Admin login failed: ${adminBody.message}`)
  const adminUser = adminBody.data.user
  const adminToken = adminBody.data.accessToken

  const testEmail = 'e2e-test@test.com'
  const testPassword = 'TestPass123!'

  const registerRes = await ctx.post(`${API}/auth/register`, { data: { name: 'E2E Test User', email: testEmail, password: testPassword, role: 'candidate' } })
  const registerBody = await registerRes.json()
  if (!registerBody.success && registerBody.message !== 'Email already registered') {
    throw new Error(`Registration failed: ${registerBody.message}`)
  }

  const loginRes = await ctx.post(`${API}/auth/login`, { data: { email: testEmail, password: testPassword } })
  const loginBody = await loginRes.json()
  if (!loginBody.success) throw new Error(`Login failed: ${loginBody.message}`)

  process.env.E2E_ACCESS_TOKEN = loginBody.data.accessToken
  process.env.E2E_USER_JSON = JSON.stringify(loginBody.data.user)
  process.env.E2E_ADMIN_TOKEN = adminToken
  process.env.E2E_ADMIN_JSON = JSON.stringify(adminUser)
  process.env.E2E_EMAIL = testEmail
  process.env.E2E_PASSWORD = testPassword
}
