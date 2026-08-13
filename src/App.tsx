import {
  ArrowUpRight,
  Check,
  DownloadSimple,
  GithubLogo,
  ImageSquare,
  LinkSimple,
  MagicWand,
  Medal,
  Sparkle,
  StarFour,
  Student,
  UploadSimple,
} from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  createCertificate,
  loadPortrait,
  normalizeDisplayText,
} from './lib/certificate'

type PrintStatus = 'idle' | 'rendering' | 'printing' | 'complete' | 'error'

interface FieldErrors {
  photo?: string
  fullName?: string
  schoolName?: string
  submit?: string
}

const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const statusMessages: Record<PrintStatus, string> = {
  idle: 'Máy in đang chờ thông tin của bạn.',
  rendering: 'Đang sắp chữ và hoàn thiện ảnh vinh danh.',
  printing: 'Ảnh vinh danh đang được in qua khe máy.',
  complete: 'Ảnh vinh danh đã hoàn tất và sẵn sàng tải về.',
  error: 'Chưa thể tạo ảnh. Vui lòng kiểm tra lại thông tin.',
}

function safeFilename(value: string) {
  const normalized = normalizeDisplayText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLocaleLowerCase('vi-VN')

  return `vinh-danh-${normalized || 'hanh-trinh-toa-sang'}.png`
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
        <img
          src="/assets/background-hero.avif"
          alt="Cổng trường truyền thống trong ánh nắng vàng, cờ đỏ sao vàng và thông điệp Hành trình tỏa sáng, Tự hào cùng các con"
          fetchPriority="high"
          width="1672"
          height="941"
        />
      </motion.div>

      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-shimmer" aria-hidden="true" />
      <h1 className="sr-only">Hành trình tỏa sáng: Tự hào cùng các con</h1>

      <nav className="site-nav" aria-label="Điều hướng chính">
        <BrandMark />
        <a className="nav-cta" href="#tao-anh">
          Tạo ảnh
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
          Tạo ảnh
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
          Thành quả hôm nay là ánh sáng của một hành trình bền bỉ.
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
}

function PrinterStudio({ onComplete }: PrinterStudioProps) {
  const reduceMotion = useReducedMotion()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const portraitUrlRef = useRef<string | null>(null)
  const resultUrlRef = useRef<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const resultRef = useRef<HTMLElement>(null)
  const isClearingRef = useRef(false)

  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null)
  const [portraitImage, setPortraitImage] = useState<HTMLImageElement | null>(null)
  const [fileName, setFileName] = useState('')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<PrintStatus>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})

  const busy = status === 'rendering' || status === 'printing'
  const ready = Boolean(portraitImage && fullName.trim() && schoolName.trim())

  const completedFields = useMemo(
    () => [Boolean(portraitImage), Boolean(fullName.trim()), Boolean(schoolName.trim())],
    [portraitImage, fullName, schoolName],
  )

  useEffect(() => {
    return () => {
      if (portraitUrlRef.current) URL.revokeObjectURL(portraitUrlRef.current)
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  function clearResult() {
    if (busy) return
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = null
    }
    setResultUrl(null)
    setStatus('idle')
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
      if (portraitUrlRef.current) URL.revokeObjectURL(portraitUrlRef.current)
      portraitUrlRef.current = nextUrl
      setPortraitUrl(nextUrl)
      setPortraitImage(image)
      setFileName(file.name)
      setErrors((current) => ({ ...current, photo: undefined }))
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current)
        resultUrlRef.current = null
      }
      setResultUrl(null)
      setStatus('idle')
    } catch {
      URL.revokeObjectURL(nextUrl)
      setErrors((current) => ({
        ...current,
        photo: 'Không thể đọc ảnh này. Hãy thử một ảnh khác.',
      }))
    }
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

    try {
      const blob = await createCertificate({ portrait: portraitImage, fullName, schoolName })
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      const nextResultUrl = URL.createObjectURL(blob)
      resultUrlRef.current = nextResultUrl
      setResultUrl(nextResultUrl)
      setStatus('printing')

      const printDuration = reduceMotion ? 250 : 3400
      timerRef.current = window.setTimeout(() => {
        setStatus('complete')
        timerRef.current = null
        window.setTimeout(() => {
          onComplete(resultRef.current)
          resultRef.current?.focus({ preventScroll: true })
        }, reduceMotion ? 0 : 180)
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

  return (
    <>
      <section id="tao-anh" className="studio" aria-labelledby="studio-title">
        <div className="studio-heading">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 id="studio-title">Đặt khoảnh khắc vào máy in vinh danh.</h2>
            <p>Ba thông tin, một tấm ảnh để lưu lại niềm tự hào.</p>
          </motion.div>

          <div className="completion-meter" aria-label="Tiến độ điền thông tin">
            {completedFields.map((complete, index) => (
              <span className={complete ? 'is-complete' : ''} key={index}>
                {complete && <Check size={13} weight="bold" aria-hidden="true" />}
                <span className="sr-only">
                  {complete ? 'Đã hoàn thành' : 'Chưa hoàn thành'} mục {index + 1}
                </span>
              </span>
            ))}
          </div>
        </div>

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
              src="/assets/ceremonial-printer.avif"
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
                    placeholder="Đại học Bách khoa Hà Nội"
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
                {resultUrl && (status === 'printing' || status === 'complete') && (
                  <motion.img
                    key={resultUrl}
                    className="printing-paper"
                    src={resultUrl}
                    alt=""
                    initial={reduceMotion ? { opacity: 1, y: '8%' } : { opacity: 0, y: '-94%' }}
                    animate={{ opacity: 1, y: status === 'complete' ? '18%' : '10%' }}
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
        {status === 'complete' && resultUrl && (
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
              <h2 id="result-title">Khoảnh khắc tỏa sáng đã sẵn sàng.</h2>
              <p>Ảnh được xuất ở kích thước 1920 × 1080, phù hợp để lưu và chia sẻ.</p>
              <a
                className="download-button"
                href={resultUrl}
                download={safeFilename(fullName)}
              >
                <DownloadSimple size={21} weight="bold" />
                Tải ảnh về máy
              </a>
              <button className="create-again" type="button" onClick={clearResult}>
                Tạo ảnh khác
              </button>
            </div>
            <motion.div
              className="result-frame"
              initial={reduceMotion ? false : { rotate: -1.8, scale: 0.94 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 90, damping: 17, delay: 0.2 }}
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
    </>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <BrandMark />
      <p>Thiết kế và phát triển bởi HyyAnk.</p>
      <div className="footer-links">
        <a
          href="https://portfolio-navy-iota-86.vercel.app/"
          target="_blank"
          rel="noreferrer"
        >
          <LinkSimple size={17} weight="bold" />
          Portfolio
          <ArrowUpRight size={14} weight="bold" />
        </a>
        <a href="https://github.com/HyyAnk" target="_blank" rel="noreferrer">
          <GithubLogo size={18} weight="fill" />
          GitHub
          <ArrowUpRight size={14} weight="bold" />
        </a>
      </div>
    </footer>
  )
}

function App() {
  const reduceMotion = useReducedMotion()

  function revealResult(element: HTMLElement | null) {
    element?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
  }

  return (
    <main>
      <Hero />
      <Introduction />
      <PrinterStudio onComplete={revealResult} />
      <Footer />
    </main>
  )
}

export default App
