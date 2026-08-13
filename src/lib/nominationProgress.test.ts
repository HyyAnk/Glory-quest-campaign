import { describe, expect, it } from 'vitest'
import { acceleratedCompletionProgress, nextWaitingProgress } from './nominationProgress'

describe('nomination progress', () => {
  it('advances steadily while waiting without reaching completion', () => {
    expect(nextWaitingProgress(2)).toBe(3)
    expect(nextWaitingProgress(87)).toBe(88)
    expect(nextWaitingProgress(88)).toBe(88)
  })

  it('accelerates from the current value and reaches exactly 100 percent', () => {
    expect(acceleratedCompletionProgress(24, 0)).toBe(24)
    expect(acceleratedCompletionProgress(24, 0.5)).toBeGreaterThan(24)
    expect(acceleratedCompletionProgress(24, 1)).toBe(100)
  })
})
