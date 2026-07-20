import { ValidationError } from '../shared/errors/AppError.js'

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const data = source === 'query' ? req.query : req.body
    const result = schema.safeParse(data)
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return next(new ValidationError(details))
    }
    if (source === 'query') {
      req.query = result.data
    } else {
      req.validatedBody = result.data
    }
    next()
  }
}
