import mongoose from 'mongoose'
import { logger } from './logger.js'

export async function ensureIndexes() {
  const db = mongoose.connection.db
  if (!db) return

  const collections = await db.listCollections().toArray()
  const collectionNames = collections.map((c) => c.name)

  const indexConfigs = [
    {
      collection: 'users',
      indexes: [
        { key: { email: 1 }, unique: true },
        { key: { role: 1 } },
        { key: { isActive: 1 } },
        { key: { name: 1 } },
        { key: { createdAt: -1 } },
      ],
    },
    {
      collection: 'questions',
      indexes: [
        { key: { title: 'text', description: 'text' }, weights: { title: 10, description: 5 }, name: 'question_text_search' },
        { key: { status: 1, createdAt: -1 } },
        { key: { questionType: 1 } },
        { key: { difficulty: 1 } },
        { key: { tags: 1 } },
        { key: { createdBy: 1 } },
        { key: { category: 1 } },
      ],
    },
    {
      collection: 'assessments',
      indexes: [
        { key: { title: 'text', description: 'text' }, name: 'assessment_text_search' },
        { key: { status: 1, createdAt: -1 } },
        { key: { assessmentType: 1 } },
        { key: { createdBy: 1 } },
        { key: { difficulty: 1 } },
      ],
    },
    {
      collection: 'attempts',
      indexes: [
        { key: { user: 1, createdAt: -1 } },
        { key: { assessment: 1 } },
        { key: { status: 1 } },
        { key: { user: 1, assessment: 1 } },
        { key: { completedAt: -1 } },
      ],
    },
    {
      collection: 'submissions',
      indexes: [
        { key: { attempt: 1 } },
        { key: { question: 1 } },
        { key: { attempt: 1, question: 1 }, unique: true },
        { key: { assessment: 1 } },
        { key: { isCorrect: 1 } },
      ],
    },
    {
      collection: 'violations',
      indexes: [
        { key: { attempt: 1 } },
        { key: { user: 1 } },
        { key: { type: 1 } },
        { key: { severity: 1 } },
        { key: { createdAt: -1 } },
      ],
    },
    {
      collection: 'tags',
      indexes: [
        { key: { category: 1 } },
      ],
    },
    {
      collection: 'settings',
      indexes: [
        { key: { key: 1 }, unique: true },
        { key: { category: 1 } },
      ],
    },
  ]

  for (const config of indexConfigs) {
    if (!collectionNames.includes(config.collection)) continue
    try {
      const col = db.collection(config.collection)
      const existingIndexes = await col.indexes()
      const existingKeys = existingIndexes.map((i) => JSON.stringify(i.key))
      const existingNames = existingIndexes.map((i) => i.name).filter(Boolean)

      for (const idx of config.indexes) {
        if (idx.name && existingNames.includes(idx.name)) continue
        const keyStr = JSON.stringify(idx.key)
        if (existingKeys.includes(keyStr)) continue

        const options = {}
        if (idx.unique) options.unique = true
        if (idx.name) options.name = idx.name
        if (idx.weights) options.weights = idx.weights

        await col.createIndex(idx.key, options)
        logger.debug(`Index created on ${config.collection}: ${JSON.stringify(idx.key)}`)
      }
    } catch (error) {
      logger.warn(`Index setup for ${config.collection}: ${error.message}`)
    }
  }

  logger.info('Database indexes verified')
}
