import {
  Trash,
  X,
} from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type FormEvent, useState } from 'react'
import {
  type GoldenNominee,
  deleteGoldenNominee,
  isDriveStorageConfigured,
} from '../lib/goldenBoard'

interface GoldenBoardProps {
  nominees: GoldenNominee[]
  loading: boolean
  onDeleted: (id: string) => void
}

export function GoldenBoard({ nominees, loading, onDeleted }: GoldenBoardProps) {
  const reduceMotion = useReducedMotion()
  const [deleting, setDeleting] = useState<GoldenNominee | null>(null)
  const [deleteCode, setDeleteCode] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const universityNominees = nominees.filter((nominee) => nominee.educationLevel === 'university')
  const highSchoolNominees = nominees.filter((nominee) => nominee.educationLevel === 'high-school')

  function closeDelete() {
    if (submitting) return
    setDeleting(null)
    setDeleteCode('')
    setDeleteError('')
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!deleting) return
    const code = deleteCode.trim().toUpperCase()
    if (!/^[A-Z]{4}$/.test(code)) {
      setDeleteError('Nhập đúng mã gồm 4 chữ cái in hoa.')
      return
    }

    setSubmitting(true)
    setDeleteError('')
    try {
      await deleteGoldenNominee(deleting.id, code)
      onDeleted(deleting.id)
      setDeleting(null)
      setDeleteCode('')
      setDeleteError('')
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Chưa thể xóa đề danh này.')
    } finally {
      setSubmitting(false)
    }
  }

  function renderRail(title: string, items: GoldenNominee[], tone: 'red' | 'blue') {
    return (
      <section className={`golden-tier golden-tier-${tone}`} aria-labelledby={`golden-tier-${tone}`}>
        <header className="golden-tier-heading">
          <h3 id={`golden-tier-${tone}`}>{title}</h3>
          <span>{items.length.toString().padStart(2, '0')}</span>
        </header>
        <div className="golden-rail">
          {items.length === 0 ? (
            <div className="golden-row-empty">Chưa có gương mặt được đề danh</div>
          ) : (
            <motion.div className="golden-track" layout>
              <AnimatePresence initial={false}>
                {items.map((nominee, index) => (
                  <motion.article
                    className="nominee-card"
                    key={nominee.id}
                    layout
                    initial={reduceMotion ? false : { opacity: 0, y: 32, rotate: index % 2 ? 0.6 : -0.6 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.65, delay: Math.min(index, 7) * 0.055, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="nominee-portrait">
                      <img src={nominee.portraitUrl} alt={`Chân dung ${nominee.fullName}`} />
                      <span className="nominee-number">{String(nominee.sequence).padStart(2, '0')}</span>
                      <span className="nominee-shine" aria-hidden="true" />
                      <button
                        className="nominee-delete"
                        type="button"
                        onClick={() => setDeleting(nominee)}
                        aria-label={`Xóa ${nominee.fullName} khỏi Bảng Vàng`}
                      >
                        <Trash size={16} weight="bold" />
                        Xóa
                      </button>
                    </div>
                    <div className="nominee-copy">
                      <h4>{nominee.fullName}</h4>
                      <p>{nominee.schoolName}</p>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section id="bang-vang" className="golden-board" aria-labelledby="golden-title">
      <div className="golden-aura" aria-hidden="true" />
      <motion.header
        className="golden-heading"
        initial={reduceMotion ? false : { opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 id="golden-title">Bảng Vàng</h2>
      </motion.header>

      {loading ? (
        <div className="golden-rows golden-loading" aria-label="Đang tải Bảng Vàng">
          {Array.from({ length: 2 }, (_, row) => (
            <div className="golden-loading-row" key={row}>
              {Array.from({ length: 4 }, (_, index) => <span key={index} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="golden-rows">
          {renderRail('Đại học', universityNominees, 'red')}
          {renderRail('Cấp 3', highSchoolNominees, 'blue')}
        </div>
      )}

      {(!isDriveStorageConfigured() || nominees.some((nominee) => nominee.storage === 'local')) && nominees.length > 0 && (
        <p className="storage-note">Bản xem trước đang lưu Bảng Vàng trên thiết bị này.</p>
      )}

      <AnimatePresence>
        {deleting && (
          <motion.div
            className="modal-backdrop"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => event.target === event.currentTarget && closeDelete()}
          >
            <motion.div
              className="delete-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
            >
              <button className="dialog-close" type="button" onClick={closeDelete} aria-label="Đóng">
                <X size={19} weight="bold" />
              </button>
              <span className="dialog-icon" aria-hidden="true"><Trash size={22} weight="duotone" /></span>
              <span className="dialog-kicker">Xác nhận quyền quản lý</span>
              <h2 id="delete-title">Xóa đề danh của {deleting.fullName}</h2>
              <p>Nhập mã 4 chữ cái đã nhận khi đề danh để hoàn tất thao tác này.</p>
              <form onSubmit={handleDelete}>
                <input
                  autoFocus
                  value={deleteCode}
                  onChange={(event) => {
                    setDeleteCode(event.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))
                    setDeleteError('')
                  }}
                  placeholder="ABCD"
                  aria-label="Mã đề danh để xác nhận xóa"
                  autoComplete="off"
                  spellCheck={false}
                />
                {deleteError && <span className="dialog-error" role="alert">{deleteError}</span>}
                <button type="submit" disabled={submitting || deleteCode.length !== 4}>
                  {submitting ? 'Đang xác nhận' : 'Xác nhận xóa'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
