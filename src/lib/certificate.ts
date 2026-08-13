export const CERTIFICATE_SIZE = { width: 1920, height: 1080 } as const

export const PORTRAIT_APERTURE = {
  x: 146,
  y: 91,
  width: 660,
  height: 989,
} as const

const TEXT_CENTER_X = 1275
const NAME_MAX_WIDTH = 750
const SCHOOL_MAX_WIDTH = 580
const SERIF_STACK = '"Noto Serif", Georgia, serif'

export interface CertificateInput {
  portrait: CanvasImageSource
  fullName: string
  schoolName: string
}

export interface CoverCrop {
  sx: number
  sy: number
  sourceWidth: number
  sourceHeight: number
}

export function normalizeDisplayText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function getCoverCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  focalX = 0.5,
  focalY = 0.42,
): CoverCrop {
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = targetWidth / targetHeight

  let cropWidth = sourceWidth
  let cropHeight = sourceHeight

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio
  } else {
    cropHeight = sourceWidth / targetRatio
  }

  const sx = Math.min(
    sourceWidth - cropWidth,
    Math.max(0, sourceWidth * focalX - cropWidth / 2),
  )
  const sy = Math.min(
    sourceHeight - cropHeight,
    Math.max(0, sourceHeight * focalY - cropHeight / 2),
  )

  return { sx, sy, sourceWidth: cropWidth, sourceHeight: cropHeight }
}

export function fitFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minimumSize: number,
  weight = 700,
): number {
  let size = startSize
  while (size > minimumSize) {
    context.font = `${weight} ${size}px ${SERIF_STACK}`
    if (context.measureText(text).width <= maxWidth) return size
    size -= 2
  }
  return minimumSize
}

export function splitBalancedLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = normalizeDisplayText(text).split(' ')
  if (words.length <= 1 || context.measureText(text).width <= maxWidth) {
    return [text]
  }

  let best: { lines: string[]; score: number } | undefined

  for (let splitAt = 1; splitAt < words.length; splitAt += 1) {
    const first = words.slice(0, splitAt).join(' ')
    const second = words.slice(splitAt).join(' ')
    const firstWidth = context.measureText(first).width
    const secondWidth = context.measureText(second).width
    const widest = Math.max(firstWidth, secondWidth)
    const balancePenalty = Math.abs(firstWidth - secondWidth) * 0.16
    const overflowPenalty = Math.max(0, widest - maxWidth) * 8
    const score = widest + balancePenalty + overflowPenalty

    if (!best || score < best.score) {
      best = { lines: [first, second], score }
    }
  }

  return best?.lines ?? [text]
}

function getImageDimensions(image: CanvasImageSource) {
  if (image instanceof HTMLImageElement) {
    return { width: image.naturalWidth, height: image.naturalHeight }
  }
  if (image instanceof HTMLVideoElement) {
    return { width: image.videoWidth, height: image.videoHeight }
  }
  if ('displayWidth' in image && 'displayHeight' in image) {
    return { width: image.displayWidth, height: image.displayHeight }
  }
  if ('width' in image && 'height' in image) {
    return { width: Number(image.width), height: Number(image.height) }
  }
  throw new Error('Không thể xác định kích thước ảnh chân dung.')
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const dimensions = getImageDimensions(image)
  const crop = getCoverCrop(dimensions.width, dimensions.height, width, height)
  context.drawImage(
    image,
    crop.sx,
    crop.sy,
    crop.sourceWidth,
    crop.sourceHeight,
    x,
    y,
    width,
    height,
  )
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Không thể tải tài nguyên hình ảnh.'))
    image.src = source
  })
}

let templatePromise: Promise<HTMLImageElement> | undefined

function getTemplate() {
  templatePromise ??= loadImage('/assets/vinh-danh-template.png')
  return templatePromise
}

async function ensureFonts() {
  if (!('fonts' in document)) return
  await Promise.all([
    document.fonts.load(`700 80px ${SERIF_STACK}`),
    document.fonts.load(`700 46px ${SERIF_STACK}`),
    document.fonts.ready,
  ])
}

function drawName(context: CanvasRenderingContext2D, value: string) {
  const text = normalizeDisplayText(value).toLocaleUpperCase('vi-VN')
  const fontSize = fitFontSize(context, text, NAME_MAX_WIDTH, 104, 48)

  context.save()
  context.font = `700 ${fontSize}px ${SERIF_STACK}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.lineJoin = 'round'
  context.lineWidth = Math.max(1.25, fontSize * 0.022)
  context.strokeStyle = 'rgba(235, 167, 66, 0.7)'
  context.shadowColor = 'rgba(93, 16, 8, 0.24)'
  context.shadowBlur = 3
  context.shadowOffsetY = 2
  context.strokeText(text, TEXT_CENTER_X, 555)
  const nameGradient = context.createLinearGradient(0, 505, 0, 610)
  nameGradient.addColorStop(0, '#ad140b')
  nameGradient.addColorStop(0.55, '#8c0804')
  nameGradient.addColorStop(1, '#700201')
  context.fillStyle = nameGradient
  context.fillText(text, TEXT_CENTER_X, 555)
  context.restore()
}

function drawSchool(context: CanvasRenderingContext2D, value: string) {
  const text = normalizeDisplayText(value).toLocaleUpperCase('vi-VN')
  let fontSize = 54
  let lines: string[] = [text]

  while (fontSize >= 32) {
    context.font = `700 ${fontSize}px ${SERIF_STACK}`
    lines = splitBalancedLines(context, text, SCHOOL_MAX_WIDTH)
    if (lines.every((line) => context.measureText(line).width <= SCHOOL_MAX_WIDTH)) break
    fontSize -= 2
  }

  const lineHeight = 66
  const firstY = lines.length === 1 ? 762 : 729

  context.save()
  context.font = `700 ${fontSize}px ${SERIF_STACK}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const schoolGradient = context.createLinearGradient(0, 692, 0, 830)
  schoolGradient.addColorStop(0, '#ad6b22')
  schoolGradient.addColorStop(1, '#82410b')
  context.fillStyle = schoolGradient
  context.shadowColor = 'rgba(105, 48, 15, 0.16)'
  context.shadowBlur = 2
  context.shadowOffsetY = 1
  lines.forEach((line, index) => {
    context.fillText(line, TEXT_CENTER_X, firstY + index * lineHeight)
  })
  context.restore()
}

export async function createCertificate({
  portrait,
  fullName,
  schoolName,
}: CertificateInput): Promise<Blob> {
  const [template] = await Promise.all([getTemplate(), ensureFonts()])
  const canvas = document.createElement('canvas')
  canvas.width = CERTIFICATE_SIZE.width
  canvas.height = CERTIFICATE_SIZE.height
  const context = canvas.getContext('2d')

  if (!context) throw new Error('Trình duyệt không hỗ trợ tạo ảnh Canvas.')

  context.fillStyle = '#fff4df'
  context.fillRect(0, 0, canvas.width, canvas.height)
  drawCoverImage(
    context,
    portrait,
    PORTRAIT_APERTURE.x,
    PORTRAIT_APERTURE.y,
    PORTRAIT_APERTURE.width,
    PORTRAIT_APERTURE.height,
  )
  context.drawImage(template, 0, 0, canvas.width, canvas.height)
  drawName(context, fullName)
  drawSchool(context, schoolName)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Không thể xuất ảnh PNG.'))),
      'image/png',
      1,
    )
  })
}

export function loadPortrait(source: string): Promise<HTMLImageElement> {
  return loadImage(source)
}
