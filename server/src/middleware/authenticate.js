import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { UnauthorizedError } from '../shared/errors/AppError.js'
import User from '../modules/users/User.js'

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided')
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, config.jwt.accessSecret)

    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated')
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'))
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'))
    } else {
      next(error)
    }
  }
}
