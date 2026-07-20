import { describe, it, expect } from '@jest/globals'

describe('Authentication', () => {
  it('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    expect(emailRegex.test('test@example.com')).toBe(true)
    expect(emailRegex.test('invalid-email')).toBe(false)
    expect(emailRegex.test('')).toBe(false)
  })

  it('should hash and compare passwords', async () => {
    const bcrypt = await import('bcrypt')
    const password = 'SecurePass123!'
    const hash = await bcrypt.hash(password, 4)
    expect(hash).not.toBe(password)
    expect(await bcrypt.compare(password, hash)).toBe(true)
    expect(await bcrypt.compare('wrong', hash)).toBe(false)
  })

  it('should generate valid JWT tokens', async () => {
    const jwt = await import('jsonwebtoken')
    const payload = { userId: '123', role: 'admin' }
    const secret = 'test-secret'
    const token = jwt.default.sign(payload, secret, { expiresIn: '15m' })
    expect(token).toBeTruthy()
    const decoded = jwt.default.verify(token, secret)
    expect(decoded.userId).toBe('123')
    expect(decoded.role).toBe('admin')
  })
})
