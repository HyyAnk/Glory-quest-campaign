import {
  DEFAULT_PORTRAIT_CROP,
  type EducationLevel,
  type PortraitCrop,
  getCoverCrop,
  normalizeDisplayText,
} from './certificate'

export interface GoldenNominee {
  id: string
  sequence: number
  fullName: string
  schoolName: string
  educationLevel: EducationLevel
  portraitUrl: string
  nominatedAt: string
  storage: 'local' | 'drive'
  pendingSync?: boolean
}

interface RemoteGoldenNominee extends Omit<GoldenNominee, 'portraitUrl'> {
  portraitBase64: string
}

interface StoredNominee extends Omit<GoldenNominee, 'portraitUrl' | 'storage'> {
  portrait: Blob
  certificate: Blob
  code: string
  fileName: string
  pendingSync?: boolean
}

export interface NominationInput {
  fullName: string
  schoolName: string
  educationLevel: EducationLevel
  code: string
  portrait: Blob
  certificate: Blob
}

const DB_NAME = 'hanh-trinh-toa-sang'
const STORE_NAME = 'golden-nominations'
const DB_VERSION = 1
const API_URL = (import.meta.env.VITE_GOLDEN_BOARD_API_URL || '').trim()
const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Không thể mở bộ nhớ Bảng Vàng.'))
  })
}

function transact<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void,
) {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode)
        operation(transaction.objectStore(STORE_NAME), resolve, reject)
        transaction.oncomplete = () => database.close()
        transaction.onerror = () => reject(transaction.error)
      }),
  )
}

function readAllLocal() {
  return transact<StoredNominee[]>('readonly', (store, resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as StoredNominee[])
    request.onerror = () => reject(request.error)
  })
}

function toPublicNominee(record: StoredNominee): GoldenNominee {
  return {
    id: record.id,
    sequence: record.sequence,
    fullName: record.fullName,
    schoolName: record.schoolName,
    educationLevel: record.educationLevel === 'high-school' ? 'high-school' : 'university',
    portraitUrl: URL.createObjectURL(record.portrait),
    nominatedAt: record.nominatedAt,
    storage: 'local',
    pendingSync: Boolean(record.pendingSync),
  }
}

function toRemotePublicNominee(nominee: RemoteGoldenNominee): GoldenNominee {
  return {
    ...nominee,
    educationLevel: nominee.educationLevel === 'high-school' ? 'high-school' : 'university',
    portraitUrl: `data:image/jpeg;base64,${nominee.portraitBase64}`,
    storage: 'drive',
  }
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return window.btoa(binary)
}

async function remoteRequest<T>(payload?: Record<string, unknown>) {
  const requestId = window.crypto.randomUUID()
  const frameName = `golden-board-${requestId}`

  return new Promise<T>((resolve, reject) => {
    const frame = document.createElement('iframe')
    frame.name = frameName
    frame.hidden = true
    frame.setAttribute('aria-hidden', 'true')
    document.body.append(frame)

    let form: HTMLFormElement | null = null
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('Kho lưu trữ phản hồi quá lâu. Vui lòng thử lại.'))
    }, 15000)

    function cleanup() {
      window.clearTimeout(timer)
      window.removeEventListener('message', handleMessage)
      form?.remove()
      frame.remove()
    }

    function handleMessage(event: MessageEvent) {
      const trustedGoogleOrigin = /^https:\/\/([a-z0-9-]+\.)*(googleusercontent\.com|script\.google\.com)$/i.test(event.origin)
      if (!trustedGoogleOrigin) return
      const result = event.data as {
        source?: string
        requestId?: string
        ok?: boolean
        data?: T
        error?: string
      }
      if (result?.source !== 'hanh-trinh-toa-sang' || result.requestId !== requestId) return
      cleanup()
      if (!result.ok) {
        reject(new Error(result.error || 'Kho lưu trữ chưa thể xử lý yêu cầu.'))
        return
      }
      resolve(result.data as T)
    }

    window.addEventListener('message', handleMessage)

    if (!payload) {
      const url = new URL(API_URL)
      url.searchParams.set('action', 'list')
      url.searchParams.set('requestId', requestId)
      frame.src = url.toString()
      return
    }

    form = document.createElement('form')
    form.method = 'POST'
    form.action = API_URL
    form.target = frameName
    form.hidden = true
    const fields = {
      requestId,
      payload: JSON.stringify(payload),
    }
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = value
      form?.append(input)
    })
    document.body.append(form)
    form.submit()
  })
}

async function remoteListRequest() {
  const callbackName = `goldenBoardCallback_${window.crypto.randomUUID().replace(/-/g, '')}`
  const url = new URL(API_URL)
  url.searchParams.set('action', 'list')
  url.searchParams.set('callback', callbackName)

  return new Promise<RemoteGoldenNominee[]>((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('Kho lưu trữ phản hồi quá lâu. Vui lòng thử lại.'))
    }, 15000)

    function cleanup() {
      window.clearTimeout(timer)
      script.remove()
      delete (window as unknown as Record<string, unknown>)[callbackName]
    }

    ;(window as unknown as Record<string, unknown>)[callbackName] = (
      result: { ok: boolean; data?: RemoteGoldenNominee[]; error?: string },
    ) => {
      cleanup()
      if (!result.ok) {
        reject(new Error(result.error || 'Kho lưu trữ chưa thể xử lý yêu cầu.'))
        return
      }
      resolve(result.data || [])
    }
    script.onerror = () => {
      cleanup()
      reject(new Error('Không thể kết nối kho lưu trữ Bảng Vàng.'))
    }
    script.crossOrigin = 'anonymous'
    script.referrerPolicy = 'no-referrer'
    script.src = url.toString()
    document.head.append(script)
  })
}

export function generateNominationCode() {
  const values = new Uint8Array(4)
  window.crypto.getRandomValues(values)
  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('')
}

export function nominationFilename(fullName: string, code: string) {
  const slug = normalizeDisplayText(fullName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLocaleLowerCase('vi-VN')

  return `vinh-danh-${slug || 'hanh-trinh-toa-sang'}-${code}.png`
}

export async function createPortraitCard(
  image: HTMLImageElement,
  cropPosition: PortraitCrop = DEFAULT_PORTRAIT_CROP,
) {
  const canvas = document.createElement('canvas')
  canvas.width = 720
  canvas.height = 900
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Trình duyệt không thể chuẩn bị ảnh Bảng Vàng.')

  const crop = getCoverCrop(
    image.naturalWidth,
    image.naturalHeight,
    canvas.width,
    canvas.height,
    cropPosition.focalX,
    cropPosition.focalY,
    cropPosition.zoom,
  )

  context.drawImage(
    image,
    crop.sx,
    crop.sy,
    crop.sourceWidth,
    crop.sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Không thể chuẩn bị ảnh Bảng Vàng.'))),
      'image/jpeg',
      0.86,
    )
  })
}

export async function listGoldenNominees() {
  const localRecords = await readAllLocal()
  const localNominees = localRecords.sort((a, b) => a.sequence - b.sequence).map(toPublicNominee)
  if (API_URL) {
    try {
      const nominees = await remoteListRequest()
      const remoteKeys = new Set(
        nominees.map((nominee) => `${nominee.fullName}|${nominee.schoolName}|${nominee.educationLevel}`.toLocaleLowerCase('vi-VN')),
      )
      const duplicatedLocalRecords = localRecords.filter((record) =>
        remoteKeys.has(`${record.fullName}|${record.schoolName}|${record.educationLevel || 'university'}`.toLocaleLowerCase('vi-VN')),
      )
      await Promise.all(duplicatedLocalRecords.map((record) => deleteLocalRecord(record.id)))
      return [
        ...nominees.map(toRemotePublicNominee),
        ...localNominees.filter((nominee) =>
          !remoteKeys.has(`${nominee.fullName}|${nominee.schoolName}|${nominee.educationLevel}`.toLocaleLowerCase('vi-VN')),
        ),
      ].sort((a, b) => a.sequence - b.sequence)
    } catch {
      return localNominees
    }
  }
  return localNominees
}

async function saveLocalNomination(input: NominationInput, pendingSync = false) {
  const records = await readAllLocal()
  const sequence = records.reduce((largest, item) => Math.max(largest, item.sequence), 0) + 1
  const record: StoredNominee & { pendingSync?: boolean } = {
    id: `local-${window.crypto.randomUUID()}`,
    sequence,
    fullName: normalizeDisplayText(input.fullName),
    schoolName: normalizeDisplayText(input.schoolName),
    educationLevel: input.educationLevel,
    portrait: input.portrait,
    certificate: input.certificate,
    code: input.code,
    nominatedAt: new Date().toISOString(),
    fileName: `${String(sequence).padStart(3, '0')}-${nominationFilename(input.fullName, input.code)}`,
    pendingSync,
  }

  await transact<void>('readwrite', (store, resolve, reject) => {
    const request = store.add(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
  return toPublicNominee(record)
}

async function deleteLocalRecord(id: string) {
  await transact<void>('readwrite', (store, resolve, reject) => {
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function syncPendingGoldenNominees() {
  if (!API_URL) return [] as GoldenNominee[]
  const pendingRecords = (await readAllLocal()).filter((record) => record.pendingSync)
  const synced: GoldenNominee[] = []

  for (const record of pendingRecords) {
    try {
      const nominee = await remoteRequest<RemoteGoldenNominee>({
        action: 'nominate',
        fullName: record.fullName,
        schoolName: record.schoolName,
        educationLevel: record.educationLevel === 'high-school' ? 'high-school' : 'university',
        code: record.code,
        portraitBase64: await blobToBase64(record.portrait),
        certificateBase64: await blobToBase64(record.certificate),
      })
      await deleteLocalRecord(record.id)
      synced.push(toRemotePublicNominee(nominee))
    } catch {
      // Giữ bản ghi local để tự thử lại trong lần tải trang tiếp theo.
    }
  }

  return synced
}

export async function nominateToGoldenBoard(input: NominationInput) {
  if (API_URL) {
    try {
      const nominee = await remoteRequest<RemoteGoldenNominee>({
      action: 'nominate',
      fullName: normalizeDisplayText(input.fullName),
      schoolName: normalizeDisplayText(input.schoolName),
      educationLevel: input.educationLevel,
      code: input.code,
      portraitBase64: await blobToBase64(input.portrait),
      certificateBase64: await blobToBase64(input.certificate),
      })
      return toRemotePublicNominee(nominee)
    } catch {
      return saveLocalNomination(input, true)
    }
  }
  return saveLocalNomination(input)
}

export async function deleteGoldenNominee(id: string, code: string) {
  if (API_URL && !id.startsWith('local-')) {
    await remoteRequest<void>({ action: 'delete', id, code })
    return
  }

  const record = await transact<StoredNominee | undefined>('readonly', (store, resolve, reject) => {
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result as StoredNominee | undefined)
    request.onerror = () => reject(request.error)
  })
  if (!record || record.code !== code) throw new Error('Mã đề danh chưa chính xác.')

  await deleteLocalRecord(id)
}

export function isDriveStorageConfigured() {
  return Boolean(API_URL)
}
