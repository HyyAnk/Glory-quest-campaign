import {
  ArrowUpRight,
  Check,
  DownloadSimple,
  GithubLogo,
  ImageSquare,
  LinkSimple,
  MagicWand,
  Medal,
  CrownSimple,
  Sparkle,
  StarFour,
  Student,
  UploadSimple,
  X,
} from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  createCertificate,
  DEFAULT_PORTRAIT_CROP,
  type EducationLevel,
  loadPortrait,
  normalizeDisplayText,
  type PortraitCrop,
} from './lib/certificate'
import { GoldenBoard } from './components/GoldenBoard'
import { PortraitCropper } from './components/PortraitCropper'
import {
  type GoldenNominee,
  createPortraitCard,
  generateNominationCode,
  listGoldenNominees,
  nominateToGoldenBoard,
  nominationFilename,
  syncPendingGoldenNominees,
} from './lib/goldenBoard'

type PrintStatus = 'idle' | 'rendering' | 'printing' | 'transferring' | 'complete' | 'error'

interface TransferGeometry {
  from: { left: number; top: number; width: number; height: number }
  to: { left: number; top: number; width: number; height: number }
}

interface FieldErrors {
  photo?: string
  fullName?: string
  schoolName?: string
  submit?: string
}

const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const statusMessages: Record<PrintStatus, string> = {
  idle: 'Chờ thông tin vinh danh',
  rendering: 'Đang sắp chữ và hoàn thiện ảnh vinh danh.',
  printing: 'Ảnh vinh danh đang được in qua khe máy.',
  transferring: 'Đang đưa ảnh vào không gian vinh danh.',
  complete: 'Ảnh vinh danh đã hoàn tất và sẵn sàng tải về.',
  error: 'Chưa thể tạo ảnh. Vui lòng kiểm tra lại thông tin.',
}

function BrandMark() {
  return (
    <a className="brand-mark" href="#top">
      <span className="brand-symbol" aria-hidden="true">
        <StarFour size={20} weight="fill" />
      </span>
      <span>
        Hành trình
        <strong>Tỏa sáng</strong>
      </span>
    </a>
  )
}

function Hero() {
  const reduceMotion = useReducedMotion()

  return (
    <header id="top" className="hero">
      <motion.div
        className="hero-art"
        initial={reduceMotion ? false : { opacity: 0, scale: 1.045 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <picture>
          <source media="(max-width: 760px)" srcSet="/assets/background-hero-mobile.webp" />
          <img
            src="/assets/background-hero.avif"
            alt="Cổng trường truyền thống trong ánh nắng vàng của hành trình tỏa sáng"
            fetchPriority="high"
            width="1672"
            height="941"
          />
        </picture>
      </motion.div>

      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-shimmer" aria-hidden="true" />
      <h1 className="sr-only">Hành trình tỏa sáng: Tự hào cùng các con</h1>

      <nav className="site-nav" aria-label="Điều hướng chính">
        <BrandMark />
        <a className="nav-cta" href="#tao-anh">
          Vinh danh
          <Sparkle size={17} weight="fill" />
        </a>
      </nav>

      <motion.div
        className="mobile-hero-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <span>Hành trình tỏa sáng</span>
        <div className="mobile-display-title" aria-hidden="true">
          Tự hào cùng các con
        </div>
        <p>Mỗi nỗ lực xứng đáng được ghi dấu bằng một khoảnh khắc trang trọng.</p>
        <a className="primary-button" href="#tao-anh">
          Vinh danh
          <Sparkle size={18} weight="fill" />
        </a>
      </motion.div>
    </header>
  )
}

const moments = [
  {
    icon: ImageSquare,
    title: 'Chọn chân dung',
    copy: 'Một bức ảnh rõ mặt, đủ sáng sẽ tạo nên khung hình đẹp nhất.',
  },
  {
    icon: Student,
    title: 'Ghi dấu thành tựu',
    copy: 'Điền họ tên và mái trường đã đồng hành cùng hành trình.',
  },
  {
    icon: Medal,
    title: 'Lưu khoảnh khắc',
    copy: 'Nhận ảnh vinh danh sắc nét, sẵn sàng lưu và chia sẻ.',
  },
]

function Introduction() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="introduction" aria-labelledby="intro-title">
      <motion.div
        className="intro-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="eyebrow">Một dấu mốc đáng nhớ</span>
        <h2 id="intro-title">
          Thành quả hôm nay là ánh sáng của một{' '}
          <span className="title-keep">hành trình bền bỉ</span>
        </h2>
        <p>
          Hãy tạo món quà nhỏ để trân trọng nỗ lực, niềm tin và những bước chân đã
          đi qua.
        </p>
      </motion.div>

      <div className="moment-list" aria-label="Cách tạo ảnh vinh danh">
        {moments.map((moment, index) => {
          const Icon = moment.icon
          return (
            <motion.article
              className="moment-item"
              key={moment.title}
              initial={reduceMotion ? false : { opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                duration: 0.65,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span className="moment-icon" aria-hidden="true">
                <Icon size={27} weight="duotone" />
              </span>
              <div>
                <h3>{moment.title}</h3>
                <p>{moment.copy}</p>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

interface PrinterStudioProps {
  onComplete: (element: HTMLElement | null) => void
  onNominated: (nominee: GoldenNominee) => void
}

function PrinterStudio({ onComplete, onNominated }: PrinterStudioProps) {
  const reduceMotion = useReducedMotion()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const portraitUrlRef = useRef<string | null>(null)
  const resultUrlRef = useRef<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const nominationProgressTimerRef = useRef<number | null>(null)
  const resultRef = useRef<HTMLElement>(null)
  const printingPaperRef = useRef<HTMLImageElement>(null)
  const resultFrameRef = useRef<HTMLDivElement>(null)
  const isClearingRef = useRef(false)

  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('university')
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null)
  const [portraitImage, setPortraitImage] = useState<HTMLImageElement | null>(null)
  const [portraitCrop, setPortraitCrop] = useState<PortraitCrop>(DEFAULT_PORTRAIT_CROP)
  const [draftPortrait, setDraftPortrait] = useState<{
    image: HTMLImageElement
    url: string
    fileName: string
    crop: PortraitCrop
    existing: boolean
  } | null>(null)
  const [fileName, setFileName] = useState('')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [transferSource, setTransferSource] = useState<TransferGeometry['from'] | null>(null)
  const [transferGeometry, setTransferGeometry] = useState<TransferGeometry | null>(null)
  const [status, setStatus] = useState<PrintStatus>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [nominationCode, setNominationCode] = useState('')
  const [nominationOpen, setNominationOpen] = useState(false)
  const [nominationInput, setNominationInput] = useState('')
  const [nominationError, setNominationError] = useState('')
  const [nominating, setNominating] = useState(false)
  const [nominationProgress, setNominationProgress] = useState(0)
  const [nominated, setNominated] = useState(false)
  const [codeReminderOpen, setCodeReminderOpen] = useState(false)

  const busy = status === 'rendering' || status === 'printing' || status === 'transferring'
  const ready = Boolean(portraitImage && fullName.trim() && schoolName.trim())

  useEffect(() => {
    return () => {
      if (portraitUrlRef.current) URL.revokeObjectURL(portraitUrlRef.current)
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      if (nominationProgressTimerRef.current) window.clearInterval(nominationProgressTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (
      status !== 'transferring' ||
      !transferSource ||
      !resultRef.current ||
      !resultFrameRef.current
    ) {
      return
    }

    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (!resultRef.current || !resultFrameRef.current) return
        const sectionRect = resultRef.current.getBoundingClientRect()
        const targetRect = resultFrameRef.current.getBoundingClientRect()

        setTransferGeometry({
          from: transferSource,
          to: {
            left: targetRect.left,
            top: targetRect.top - sectionRect.top,
            width: targetRect.width,
            height: targetRect.height,
          },
        })
        onComplete(resultRef.current)
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [onComplete, status, transferSource])

  function clearResult() {
    if (busy) return
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = null
    }
    setResultUrl(null)
    setTransferSource(null)
    setTransferGeometry(null)
    setStatus('idle')
    setNominationCode('')
    setNominationOpen(false)
    setNominationInput('')
    setNominationError('')
    if (nominationProgressTimerRef.current) {
      window.clearInterval(nominationProgressTimerRef.current)
      nominationProgressTimerRef.current = null
    }
    setNominationProgress(0)
    setNominated(false)
    setErrors((current) => ({ ...current, submit: undefined }))
  }

  function invalidateResult() {
    if (isClearingRef.current || busy) return
    isClearingRef.current = true
    clearResult()
    window.queueMicrotask(() => {
      isClearingRef.current = false
    })
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        photo: 'Chọn ảnh JPG, PNG hoặc WebP.',
      }))
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((current) => ({
        ...current,
        photo: 'Ảnh cần nhỏ hơn 12 MB.',
      }))
      event.target.value = ''
      return
    }

    const nextUrl = URL.createObjectURL(file)

    try {
      const image = await loadPortrait(nextUrl)
      setDraftPortrait({
        image,
        url: nextUrl,
        fileName: file.name,
        crop: DEFAULT_PORTRAIT_CROP,
        existing: false,
      })
      setErrors((current) => ({ ...current, photo: undefined }))
      event.target.value = ''
    } catch {
      URL.revokeObjectURL(nextUrl)
      setErrors((current) => ({
        ...current,
        photo: 'Không thể đọc ảnh này. Hãy thử một ảnh khác.',
      }))
    }
  }

  function cancelCrop() {
    if (!draftPortrait) return
    if (!draftPortrait.existing) URL.revokeObjectURL(draftPortrait.url)
    setDraftPortrait(null)
  }

  function confirmCrop(crop: PortraitCrop) {
    if (!draftPortrait) return
    if (portraitUrlRef.current && portraitUrlRef.current !== draftPortrait.url) {
      URL.revokeObjectURL(portraitUrlRef.current)
    }
    portraitUrlRef.current = draftPortrait.url
    setPortraitUrl(draftPortrait.url)
    setPortraitImage(draftPortrait.image)
    setPortraitCrop(crop)
    setFileName(draftPortrait.fileName)
    setDraftPortrait(null)
    invalidateResult()
  }

  function editCrop() {
    if (!portraitImage || !portraitUrl) return
    setDraftPortrait({ image: portraitImage, url: portraitUrl, fileName, crop: portraitCrop, existing: true })
  }

  function validate() {
    const nextErrors: FieldErrors = {}
    if (!portraitImage) nextErrors.photo = 'Vui lòng chọn một ảnh chân dung.'
    if (!normalizeDisplayText(fullName)) nextErrors.fullName = 'Vui lòng nhập họ và tên.'
    if (!normalizeDisplayText(schoolName)) {
      nextErrors.schoolName = 'Vui lòng nhập tên trường.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handlePrint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate() || !portraitImage || busy) return

    setStatus('rendering')
    setErrors({})
    const nextCode = generateNominationCode()
    setNominationCode(nextCode)
    setNominationOpen(false)
    setNominationInput('')
    setNominationError('')
    setNominationProgress(0)
    setNominated(false)

    try {
      const blob = await createCertificate({
        portrait: portraitImage,
        portraitCrop,
        fullName,
        schoolName,
        educationLevel,
      })
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      const nextResultUrl = URL.createObjectURL(blob)
      resultUrlRef.current = nextResultUrl
      setResultUrl(nextResultUrl)
      setStatus('printing')

      const printDuration = reduceMotion ? 250 : 3400
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null

        if (reduceMotion) {
          setStatus('complete')
          onComplete(resultRef.current)
          resultRef.current?.focus({ preventScroll: true })
          return
        }

        const paperRect = printingPaperRef.current?.getBoundingClientRect()
        if (!paperRect) {
          setStatus('complete')
          onComplete(resultRef.current)
          return
        }

        setTransferSource({
          left: paperRect.left,
          top: paperRect.top,
          width: paperRect.width,
          height: paperRect.height,
        })
        setStatus('transferring')
      }, printDuration)
    } catch (error) {
      setStatus('error')
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Không thể tạo ảnh. Vui lòng thử lại.',
      })
    }
  }

  async function handleNomination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resultUrl || !portraitImage || nominating || nominated) return
    if (nominationInput !== nominationCode) {
      setNominationError('Mã xác nhận chưa chính xác.')
      return
    }

    setNominating(true)
    setNominationProgress(6)
    setNominationError('')
    nominationProgressTimerRef.current = window.setInterval(() => {
      setNominationProgress((current) => {
        if (current >= 92) return current
        const remaining = 92 - current
        return Math.min(92, current + Math.max(1, Math.ceil(remaining * 0.12)))
      })
    }, 180)
    try {
      const [certificate, portrait] = await Promise.all([
        fetch(resultUrl).then((response) => response.blob()),
        createPortraitCard(portraitImage, portraitCrop),
      ])
      const nominee = await nominateToGoldenBoard({
        fullName,
        schoolName,
        educationLevel,
        code: nominationCode,
        portrait,
        certificate,
      })
      onNominated(nominee)
      if (nominationProgressTimerRef.current) {
        window.clearInterval(nominationProgressTimerRef.current)
        nominationProgressTimerRef.current = null
      }
      setNominationProgress(100)
      await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 80 : 520))
      setNominated(true)
      setNominationOpen(false)
      setCodeReminderOpen(true)
    } catch (error) {
      if (nominationProgressTimerRef.current) {
        window.clearInterval(nominationProgressTimerRef.current)
        nominationProgressTimerRef.current = null
      }
      setNominationProgress(0)
      setNominationError(error instanceof Error ? error.message : 'Chưa thể đề danh lúc này.')
    } finally {
      setNominating(false)
    }
  }

  return (
    <>
      <section id="tao-anh" className="studio" aria-label="Máy in ảnh vinh danh">
        <form className="printer-workbench" onSubmit={handlePrint} noValidate>
          <motion.div
            className="printer-shell"
            initial={reduceMotion ? false : { opacity: 0, y: 45, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              className="printer-image"
              src="/assets/ceremonial-printer-v2.webp"
              alt="Máy in vinh danh màu đỏ son và vàng ánh kim"
              width="1774"
              height="887"
            />

            <div className="printer-controls">
              <div className={`console-field upload-field ${errors.photo ? 'has-error' : ''}`}>
                <span className="console-label">Nhập ảnh</span>
                <input
                  ref={fileInputRef}
                  className="visually-hidden-input"
                  type="file"
                  tabIndex={-1}
                  aria-hidden="true"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFile}
                  disabled={busy}
                  aria-invalid={Boolean(errors.photo)}
                  aria-describedby={errors.photo ? 'photo-error' : undefined}
                />
                <button
                  className="upload-button"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                >
                  {portraitUrl ? (
                    <img src={portraitUrl} alt="Ảnh chân dung đã chọn" />
                  ) : (
                    <UploadSimple size={19} weight="bold" aria-hidden="true" />
                  )}
                  <span>{fileName || 'Chọn chân dung'}</span>
                </button>
                {portraitUrl && (
                  <button className="recrop-button" type="button" onClick={editCrop} disabled={busy}>
                    Căn lại
                  </button>
                )}
                {errors.photo && (
                  <span className="field-error" id="photo-error">
                    {errors.photo}
                  </span>
                )}
              </div>

              <label className={`console-field ${errors.fullName ? 'has-error' : ''}`}>
                <span className="console-label">Họ và tên</span>
                <span className="input-wrap">
                  <Student size={18} weight="duotone" aria-hidden="true" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value)
                      setErrors((current) => ({ ...current, fullName: undefined }))
                      invalidateResult()
                    }}
                    maxLength={42}
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
                    disabled={busy}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? 'name-error' : undefined}
                  />
                </span>
                {errors.fullName && (
                  <span className="field-error" id="name-error">
                    {errors.fullName}
                  </span>
                )}
              </label>

              <div className="school-control-group">
                <label className="console-field education-field">
                  <span className="console-label">Cấp học</span>
                  <span className="input-wrap select-wrap">
                    <select
                      value={educationLevel}
                      onChange={(event) => {
                        setEducationLevel(event.target.value as EducationLevel)
                        invalidateResult()
                      }}
                      disabled={busy}
                      aria-label="Chọn cấp học để đổi mẫu ảnh vinh danh"
                    >
                      <option value="high-school">Cấp 3</option>
                      <option value="university">Đại học</option>
                    </select>
                  </span>
                </label>

                <label className={`console-field ${errors.schoolName ? 'has-error' : ''}`}>
                  <span className="console-label">Tên trường</span>
                  <span className="input-wrap">
                    <Medal size={18} weight="duotone" aria-hidden="true" />
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(event) => {
                        setSchoolName(event.target.value)
                        setErrors((current) => ({ ...current, schoolName: undefined }))
                        invalidateResult()
                      }}
                      maxLength={90}
                      placeholder={educationLevel === 'high-school' ? 'VD: THPT Trần Phú' : 'VD: Đại Học Hàng Hải'}
                      autoComplete="organization"
                      disabled={busy}
                      aria-invalid={Boolean(errors.schoolName)}
                      aria-describedby={errors.schoolName ? 'school-error' : undefined}
                    />
                  </span>
                  {errors.schoolName && (
                    <span className="field-error" id="school-error">
                      {errors.schoolName}
                    </span>
                  )}
                </label>
              </div>

              <div className="console-field print-control">
                <span className="console-label">Hoàn tất</span>
                <button
                  className="print-button"
                  type="submit"
                  disabled={!ready || busy}
                  aria-label={busy ? 'Máy đang in ảnh vinh danh' : 'Vinh danh ngay'}
                >
                  <MagicWand size={20} weight="fill" aria-hidden="true" />
                  <span>{busy ? 'Đang in' : 'Vinh danh'}</span>
                </button>
              </div>
            </div>

            <div className="paper-stage" aria-hidden="true">
              <div className="output-slot" />
              <AnimatePresence>
                {resultUrl && status === 'printing' && (
                  <motion.img
                    ref={printingPaperRef}
                    key={resultUrl}
                    className="printing-paper"
                    src={resultUrl}
                    alt=""
                    initial={reduceMotion ? { opacity: 1, y: '8%' } : { opacity: 0, y: '-94%' }}
                    animate={{ opacity: 1, y: '10%' }}
                    exit={{ opacity: 0 }}
                    transition={{
                      opacity: { duration: 0.25 },
                      y: reduceMotion
                        ? { duration: 0.2 }
                        : { duration: 3.25, ease: [0.3, 0.03, 0.14, 1] },
                    }}
                  />
                )}
              </AnimatePresence>
              {status === 'printing' && !reduceMotion && (
                <motion.span
                  className="scanner-light"
                  initial={{ opacity: 0, scaleX: 0.1 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0.25, 1, 0.35] }}
                  transition={{ duration: 1.1, repeat: 2, ease: 'easeInOut' }}
                />
              )}
            </div>
          </motion.div>

          <div
            className={`machine-status status-${status}`}
            role="status"
            aria-live="polite"
          >
            <span className="status-icon" aria-hidden="true">
              {status === 'complete' ? (
                <Check size={16} weight="bold" />
              ) : (
                <Sparkle size={15} weight="fill" />
              )}
            </span>
            <span>{errors.submit || statusMessages[status]}</span>
          </div>
        </form>
      </section>

      <AnimatePresence>
        {(status === 'transferring' || status === 'complete') && resultUrl && (
          <motion.section
            ref={resultRef}
            className="result-section"
            aria-labelledby="result-title"
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 52 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="result-rays" aria-hidden="true" />
            <div className="result-copy">
              <span className="success-seal" aria-hidden="true">
                <Check size={24} weight="bold" />
              </span>
              <h2 id="result-title">
                Khoảnh khắc tỏa sáng <span className="title-keep">đã sẵn sàng</span>
              </h2>
              <a
                className="download-button"
                href={resultUrl}
                download={nominationFilename(fullName, nominationCode || 'VINH')}
              >
                <DownloadSimple size={21} weight="bold" />
                Tải ảnh về máy
              </a>
              <button
                className="nominate-button"
                type="button"
                onClick={() => setNominationOpen((value) => !value)}
                disabled={nominated}
                aria-expanded={nominationOpen}
              >
                <CrownSimple size={21} weight="fill" />
                {nominated ? 'Đã đề danh Bảng Vàng' : 'Đề danh Bảng Vàng'}
              </button>
              <p className="nomination-hint">
                Bấm nút <strong>Đề danh</strong> để lưu tên vào <strong>Bảng Vàng</strong>
              </p>
              <AnimatePresence>
                {nominationOpen && !nominated && (
                  <motion.form
                    className="nomination-confirm"
                    onSubmit={handleNomination}
                    initial={reduceMotion ? false : { opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                  >
                    {nominating ? (
                      <div className="nomination-progress" role="status" aria-live="polite">
                        <div className="nomination-progress-heading">
                          <span>{nominationProgress === 100 ? 'Đã hoàn tất đề danh' : 'Đang đưa tên bạn vào Bảng Vàng'}</span>
                          <strong>{nominationProgress}%</strong>
                        </div>
                        <div
                          className="nomination-progress-track"
                          role="progressbar"
                          aria-label="Tiến trình đề danh Bảng Vàng"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={nominationProgress}
                        >
                          <motion.span
                            initial={false}
                            animate={{ scaleX: nominationProgress / 100 }}
                            transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                        <small>Vui lòng giữ trang này mở trong giây lát</small>
                      </div>
                    ) : (
                      <>
                        <span>Mã xác nhận của ảnh này</span>
                        <strong aria-label={`Mã đề danh ${nominationCode.split('').join(' ')}`}>
                          {nominationCode.split('').map((letter, index) => <i key={`${letter}-${index}`}>{letter}</i>)}
                        </strong>
                        <label htmlFor="nomination-code">Gõ lại 4 ký tự để xác nhận đề danh</label>
                        <div>
                          <input
                            id="nomination-code"
                            value={nominationInput}
                            onChange={(event) => {
                              setNominationInput(event.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))
                              setNominationError('')
                            }}
                            placeholder="ABCD"
                            autoComplete="off"
                            spellCheck={false}
                            autoFocus
                          />
                          <button type="submit" disabled={nominationInput.length !== 4}>
                            Xác nhận
                          </button>
                        </div>
                      </>
                    )}
                    {nominationError && <span className="nomination-error" role="alert">{nominationError}</span>}
                  </motion.form>
                )}
              </AnimatePresence>
              <button className="create-again" type="button" onClick={clearResult}>
                Tạo ảnh khác
              </button>
            </div>
            <motion.div
              ref={resultFrameRef}
              className={`result-frame ${status === 'transferring' ? 'is-receiving' : 'is-complete'}`}
              initial={false}
              animate={{ opacity: status === 'complete' ? 1 : 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={resultUrl}
                alt={`Ảnh vinh danh của ${normalizeDisplayText(fullName)}`}
              />
              <span className="frame-shine" aria-hidden="true" />
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {draftPortrait && (
          <PortraitCropper
            image={draftPortrait.image}
            imageUrl={draftPortrait.url}
            educationLevel={educationLevel}
            initialCrop={draftPortrait.crop}
            onCancel={cancelCrop}
            onConfirm={confirmCrop}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {codeReminderOpen && (
          <motion.div
            className="modal-backdrop nomination-success-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="nomination-success"
              role="dialog"
              aria-modal="true"
              aria-labelledby="nomination-success-title"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.84, rotate: -1.5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            >
              <span className="success-orbit" aria-hidden="true" />
              <button type="button" className="dialog-close" onClick={() => setCodeReminderOpen(false)} aria-label="Đóng">
                <X size={19} weight="bold" />
              </button>
              <span className="success-crown" aria-hidden="true"><CrownSimple size={30} weight="fill" /></span>
              <span className="dialog-kicker">Đề danh thành công</span>
              <h2 id="nomination-success-title">Tên bạn đã được ghi vào Bảng Vàng</h2>
              <p>Hãy ghi nhớ mã này. Bạn sẽ cần mã để quản lý hoặc xóa đề danh.</p>
              <strong className="reminder-code">{nominationCode}</strong>
              <button className="success-continue" type="button" onClick={() => {
                setCodeReminderOpen(false)
                document.querySelector('#bang-vang')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
              }}>
                Xem Bảng Vàng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transferGeometry && resultUrl && (
          <motion.img
            className="certificate-flight"
            src={resultUrl}
            alt=""
            aria-hidden="true"
            initial={{
              x: 0,
              y: 0,
              scale: 1,
              rotate: 0.6,
              opacity: 1,
            }}
            animate={{
              x: transferGeometry.to.left - transferGeometry.from.left,
              y: transferGeometry.to.top - transferGeometry.from.top,
              scale: transferGeometry.to.width / transferGeometry.from.width,
              rotate: 0,
              opacity: 1,
            }}
            exit={{ opacity: 0, transition: { duration: 0.14, ease: 'easeOut' } }}
            transition={{
              duration: 1.65,
              ease: [0.22, 0.78, 0.18, 1],
            }}
            style={{
              left: transferGeometry.from.left,
              top: transferGeometry.from.top,
              width: transferGeometry.from.width,
              height: transferGeometry.from.height,
            }}
            onAnimationComplete={() => {
              setStatus('complete')
              setTransferGeometry(null)
              setTransferSource(null)
              resultRef.current?.focus({ preventScroll: true })
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <BrandMark />
      <p>
        <span className="footer-credit-desktop">
          Thiết kế và phát triển bởi HyyAnk - Dư Ngọc Minh Hoàng
        </span>
        <span className="footer-credit-mobile">HyyAnk - Dư Ngọc Minh Hoàng</span>
      </p>
      <div className="footer-links">
        <a
          href="https://portfolio-navy-iota-86.vercel.app/"
          target="_blank"
          rel="noreferrer"
        >
          <LinkSimple size={17} weight="bold" />
          Portfolio
          <ArrowUpRight className="footer-arrow" size={14} weight="bold" />
        </a>
        <a href="https://github.com/HyyAnk" target="_blank" rel="noreferrer">
          <GithubLogo size={18} weight="fill" />
          GitHub
          <ArrowUpRight className="footer-arrow" size={14} weight="bold" />
        </a>
      </div>
    </footer>
  )
}

function App() {
  const reduceMotion = useReducedMotion()
  const [nominees, setNominees] = useState<GoldenNominee[]>([])
  const [boardLoading, setBoardLoading] = useState(true)

  useEffect(() => {
    let active = true
    listGoldenNominees()
      .then(async (items) => {
        if (!active) return
        setNominees(items)
        setBoardLoading(false)
        const synced = await syncPendingGoldenNominees()
        if (!active || synced.length === 0) return
        const syncedCodes = new Set(synced.map((item) => `${item.fullName}|${item.schoolName}|${item.educationLevel}`))
        setNominees((current) => [
          ...current.filter((item) => !(item.pendingSync && syncedCodes.has(`${item.fullName}|${item.schoolName}|${item.educationLevel}`))),
          ...synced,
        ].sort((a, b) => a.sequence - b.sequence))
      })
      .catch(() => active && setNominees([]))
      .finally(() => active && setBoardLoading(false))
    return () => {
      active = false
    }
  }, [])

  function revealResult(element: HTMLElement | null) {
    element?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <main>
      <Hero />
      <Introduction />
      <GoldenBoard
        nominees={nominees}
        loading={boardLoading}
        onDeleted={(id) => {
          setNominees((items) => {
            const target = items.find((item) => item.id === id)
            if (target?.storage === 'local') URL.revokeObjectURL(target.portraitUrl)
            return items.filter((item) => item.id !== id)
          })
        }}
      />
      <PrinterStudio
        onComplete={revealResult}
        onNominated={(nominee) => setNominees((items) => [...items, nominee].sort((a, b) => a.sequence - b.sequence))}
      />
      <Footer />
    </main>
  )
}

export default App
