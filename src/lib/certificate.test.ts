import { describe, expect, it } from 'vitest'
import {
  type EducationLevel,
  fitFontSize,
  getCoverCrop,
  normalizePortraitCrop,
  normalizeDisplayText,
  PORTRAIT_APERTURE,
  splitBalancedLines,
} from './certificate'

const educationLevels: EducationLevel[] = ['high-school', 'university']

describe('certificate helpers', () => {
  it('supports the two campaign education levels', () => {
    expect(educationLevels).toEqual(['high-school', 'university'])
  })

  it('matches the transparent portrait window measured from both templates', () => {
    expect(PORTRAIT_APERTURE).toEqual({ x: 297, y: 192, width: 486, height: 697 })
  })

  it('normalizes repeated whitespace', () => {
    expect(normalizeDisplayText('  Nguyễn   Văn A  ')).toBe('Nguyễn Văn A')
  })

  it('crops a landscape photo to a portrait target without distortion', () => {
    const crop = getCoverCrop(1600, 900, 490, 680)
    expect(crop.sourceHeight).toBe(900)
    expect(crop.sourceWidth / crop.sourceHeight).toBeCloseTo(490 / 680, 4)
    expect(crop.sx).toBeGreaterThan(0)
  })

  it('keeps a dragged and zoomed crop inside the source image', () => {
    const crop = normalizePortraitCrop(1600, 900, 660, 989, {
      zoom: 1.8,
      focalX: 1.4,
      focalY: -0.2,
    })
    const source = getCoverCrop(1600, 900, 660, 989, crop.focalX, crop.focalY, crop.zoom)

    expect(source.sx).toBeGreaterThanOrEqual(0)
    expect(source.sy).toBeGreaterThanOrEqual(0)
    expect(source.sx + source.sourceWidth).toBeLessThanOrEqual(1600)
    expect(source.sy + source.sourceHeight).toBeLessThanOrEqual(900)
  })

  it('balances a long school name across two lines', () => {
    const context = {
      measureText: (text: string) => ({ width: text.length * 10 }),
    } as CanvasRenderingContext2D

    const lines = splitBalancedLines(
      context,
      'TRƯỜNG ĐẠI HỌC BÁCH KHOA HÀ NỘI',
      200,
    )
    expect(lines).toHaveLength(2)
    expect(lines.join(' ')).toBe('TRƯỜNG ĐẠI HỌC BÁCH KHOA HÀ NỘI')
  })

  it('shrinks long names until they fit the available width', () => {
    const context = {
      font: '',
      measureText: () => ({ width: 900 }),
    } as unknown as CanvasRenderingContext2D

    expect(fitFontSize(context, 'NGUYỄN THỊ MINH ANH', 750, 104, 48)).toBe(48)
  })
})
