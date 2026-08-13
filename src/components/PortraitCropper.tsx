import { ArrowsOutCardinal, Check, MagnifyingGlassMinus, MagnifyingGlassPlus, X } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { type PointerEvent as ReactPointerEvent, useRef, useState } from 'react'
import highSchoolTemplateUrl from '../../Source/Vinh danh Template 2.png'
import {
  CERTIFICATE_SIZE,
  type EducationLevel,
  PORTRAIT_APERTURE,
  type PortraitCrop,
  getCoverCrop,
  normalizePortraitCrop,
} from '../lib/certificate'

interface PortraitCropperProps {
  image: HTMLImageElement
  imageUrl: string
  educationLevel: EducationLevel
  initialCrop: PortraitCrop
  onCancel: () => void
  onConfirm: (crop: PortraitCrop) => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 2.5

export function PortraitCropper({ image, imageUrl, educationLevel, initialCrop, onCancel, onConfirm }: PortraitCropperProps) {
  const reduceMotion = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; crop: PortraitCrop } | null>(null)
  const [crop, setCrop] = useState(() => normalizePortraitCrop(
    image.naturalWidth,
    image.naturalHeight,
    PORTRAIT_APERTURE.width,
    PORTRAIT_APERTURE.height,
    initialCrop,
  ))

  const sourceCrop = getCoverCrop(
    image.naturalWidth,
    image.naturalHeight,
    PORTRAIT_APERTURE.width,
    PORTRAIT_APERTURE.height,
    crop.focalX,
    crop.focalY,
    crop.zoom,
  )

  const previewWidth = image.naturalWidth / sourceCrop.sourceWidth * 100
  const previewHeight = image.naturalHeight / sourceCrop.sourceHeight * 100
  const previewLeft = -sourceCrop.sx / sourceCrop.sourceWidth * 100
  const previewTop = -sourceCrop.sy / sourceCrop.sourceHeight * 100
  const templateUrl = educationLevel === 'high-school'
    ? highSchoolTemplateUrl
    : '/assets/vinh-danh-template.png'
  const templateWidth = CERTIFICATE_SIZE.width / PORTRAIT_APERTURE.width * 100
  const templateHeight = CERTIFICATE_SIZE.height / PORTRAIT_APERTURE.height * 100
  const templateLeft = -PORTRAIT_APERTURE.x / PORTRAIT_APERTURE.width * 100
  const templateTop = -PORTRAIT_APERTURE.y / PORTRAIT_APERTURE.height * 100

  function updateCrop(next: PortraitCrop) {
    setCrop(normalizePortraitCrop(
      image.naturalWidth,
      image.naturalHeight,
      PORTRAIT_APERTURE.width,
      PORTRAIT_APERTURE.height,
      next,
    ))
  }

  function changeZoom(delta: number) {
    updateCrop({ ...crop, zoom: crop.zoom + delta })
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, crop }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const stage = stageRef.current
    if (!drag || !stage) return
    const dragCrop = getCoverCrop(
      image.naturalWidth,
      image.naturalHeight,
      PORTRAIT_APERTURE.width,
      PORTRAIT_APERTURE.height,
      drag.crop.focalX,
      drag.crop.focalY,
      drag.crop.zoom,
    )
    const rect = stage.getBoundingClientRect()
    const deltaX = (event.clientX - drag.x) / rect.width
    const deltaY = (event.clientY - drag.y) / rect.height
    updateCrop({
      ...drag.crop,
      focalX: drag.crop.focalX - deltaX * (dragCrop.sourceWidth / image.naturalWidth),
      focalY: drag.crop.focalY - deltaY * (dragCrop.sourceHeight / image.naturalHeight),
    })
  }

  function stopDrag(event: ReactPointerEvent<HTMLDivElement>) {
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <motion.div
      className="cropper-backdrop"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <motion.section
        className="portrait-cropper"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cropper-title"
        initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.975 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.985 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="cropper-heading">
          <span className="cropper-kicker"><ArrowsOutCardinal size={17} weight="bold" /> Căn chỉnh chân dung</span>
          <h2 id="cropper-title">Đặt gương mặt vào vùng hiển thị</h2>
          <p>Kéo ảnh để chọn đúng phần chân dung sẽ xuất hiện trên ảnh vinh danh</p>
          <button type="button" className="cropper-close" onClick={onCancel} aria-label="Đóng căn chỉnh ảnh">
            <X size={19} weight="bold" />
          </button>
        </header>

        <div
          ref={stageRef}
          className="cropper-stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          aria-label="Kéo ảnh để căn chỉnh chân dung"
        >
          <img
            src={imageUrl}
            alt="Ảnh chân dung đang căn chỉnh"
            draggable={false}
            style={{
              width: `${previewWidth}%`,
              height: `${previewHeight}%`,
              left: `${previewLeft}%`,
              top: `${previewTop}%`,
            }}
          />
          <span className="cropper-grid" aria-hidden="true" />
          <img
            className="cropper-template-mask"
            src={templateUrl}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              width: `${templateWidth}%`,
              height: `${templateHeight}%`,
              left: `${templateLeft}%`,
              top: `${templateTop}%`,
            }}
          />
          <span className="cropper-focus" aria-hidden="true" />
          <span className="cropper-drag-hint" aria-hidden="true"><ArrowsOutCardinal size={17} weight="bold" /> Kéo để căn ảnh</span>
        </div>

        <div className="cropper-toolbar">
          <label htmlFor="portrait-zoom">Phóng ảnh</label>
          <button type="button" className="cropper-zoom-button" onClick={() => changeZoom(-0.1)} aria-label="Thu nhỏ ảnh">
            <MagnifyingGlassMinus size={18} aria-hidden="true" />
          </button>
          <input
            id="portrait-zoom"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.01"
            value={crop.zoom}
            onChange={(event) => updateCrop({ ...crop, zoom: Number(event.target.value) })}
          />
          <button type="button" className="cropper-zoom-button" onClick={() => changeZoom(0.1)} aria-label="Phóng to ảnh">
            <MagnifyingGlassPlus size={18} aria-hidden="true" />
          </button>
          <span>{Math.round(crop.zoom * 100)}%</span>
        </div>

        <footer className="cropper-actions">
          <button type="button" className="cropper-cancel" onClick={onCancel}>Chọn ảnh khác</button>
          <button type="button" className="cropper-confirm" onClick={() => onConfirm(crop)}>
            <Check size={18} weight="bold" />
            Dùng khung hình này
          </button>
        </footer>
      </motion.section>
    </motion.div>
  )
}
