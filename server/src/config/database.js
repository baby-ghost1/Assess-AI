import mongoose from 'mongoose'
import { config } from './index.js'
import { logger } from './logger.js'

export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodbUri)
    logger.info('MongoDB connected successfully')
  } catch (error) {
    logger.error('MongoDB connection failed:', error)
    process.exit(1)
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err)
  })

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected')
  })
}
