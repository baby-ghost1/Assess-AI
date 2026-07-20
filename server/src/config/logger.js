import winston from 'winston'
import { config } from './index.js'

export const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    config.nodeEnv === 'development'
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const stack = meta.stack ? `\n${meta.stack}` : ''
            delete meta.stack
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
            return `${timestamp} [${level}]: ${message}${metaStr}${stack}`
          })
        )
      : winston.format.json()
  ),
  transports: [new winston.transports.Console()],
})
