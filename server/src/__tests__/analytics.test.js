import { describe, it, expect } from '@jest/globals'

describe('Analytics Service', () => {
  it('should calculate pass rate correctly', () => {
    const calculatePassRate = (completed, passed) => {
      if (completed === 0) return 0
      return Math.round((passed / completed) * 100 * 100) / 100
    }

    expect(calculatePassRate(10, 7)).toBe(70)
    expect(calculatePassRate(10, 0)).toBe(0)
    expect(calculatePassRate(0, 0)).toBe(0)
    expect(calculatePassRate(1, 1)).toBe(100)
  })

  it('should calculate average score correctly', () => {
    const calculateAvg = (scores) => {
      if (scores.length === 0) return 0
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      return Math.round(avg * 100) / 100
    }

    expect(calculateAvg([80, 90, 100])).toBe(90)
    expect(calculateAvg([])).toBe(0)
    expect(calculateAvg([50])).toBe(50)
  })

  it('should calculate difficulty index correctly', () => {
    const calculateDifficultyIndex = (correct, total) => {
      if (total === 0) return 0
      return Math.round((1 - correct / total) * 100) / 100
    }

    expect(calculateDifficultyIndex(8, 10)).toBe(0.2)
    expect(calculateDifficultyIndex(2, 10)).toBe(0.8)
    expect(calculateDifficultyIndex(0, 10)).toBe(1)
    expect(calculateDifficultyIndex(0, 0)).toBe(0)
  })
})
