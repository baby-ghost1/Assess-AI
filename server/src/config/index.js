import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

function requireEnv(name, fallback) {
  const value = process.env[name] || fallback
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: requireEnv('MONGODB_URI', 'mongodb://localhost:27017/ai-assessment-platform'),
  redisUrl: requireEnv('REDIS_URL', 'redis://localhost:6379'),
  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET', process.env.NODE_ENV === 'production' ? undefined : 'dev-access-secret-change-in-production'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET', process.env.NODE_ENV === 'production' ? undefined : 'dev-refresh-secret-change-in-production'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  admin: {
    email: requireEnv('ADMIN_EMAIL', 'admin@assessai.com'),
    password: requireEnv('ADMIN_PASSWORD', process.env.NODE_ENV === 'production' ? undefined : 'Admin@123456'),
  },
  brevoApiKey: process.env.BREVO_API_KEY || '',
  fromEmail: process.env.FROM_EMAIL || 'noreply@assessai.com',
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
  },
}
