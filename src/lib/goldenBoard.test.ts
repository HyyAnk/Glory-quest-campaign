import { describe, expect, it, vi } from 'vitest'
import { generateNominationCode, nominationFilename } from './goldenBoard'

describe('goldenBoard utilities', () => {
  it('creates a four-letter uppercase nomination code', () => {
    vi.spyOn(window.crypto, 'getRandomValues').mockImplementation((values) => {
      const target = values as Uint8Array
      target.set([0, 1, 25, 26])
      return values
    })

    expect(generateNominationCode()).toBe('ABZA')
    vi.restoreAllMocks()
  })

  it('adds the nomination code to a normalized download filename', () => {
    expect(nominationFilename('Dư Ngọc Minh Hoàng', 'ABCD')).toBe(
      'vinh-danh-du-ngoc-minh-hoang-ABCD.png',
    )
  })

  it('keeps the download filename stable for the blue template', () => {
    expect(nominationFilename('Nguyễn Hoàng An', 'XANH')).toBe(
      'vinh-danh-nguyen-hoang-an-XANH.png',
    )
  })
})
