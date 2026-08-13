const INDEX_FILE_NAME = '_bang-vang-index.json';
const FOLDER_PROPERTY = 'GOLDEN_BOARD_FOLDER_ID';
const SALT_PROPERTY = 'NOMINATION_CODE_SALT';

function doGet(event) {
  const requestId = cleanRequestId_(event && event.parameter && event.parameter.requestId);
  const callback = cleanCallback_(event && event.parameter && event.parameter.callback);
  try {
    const index = withIndexLock_(function() {
      return readIndex_();
    });
    const nominees = index.items.map(toPublicNominee_).sort(function(a, b) {
      return a.sequence - b.sequence;
    });
    log_('INFO', 'list', 'Returned Golden Board nominees', { total: nominees.length });
    const response = { ok: true, data: nominees };
    return callback ? jsonpResponse_(callback, response) : bridgeResponse_(requestId, response);
  } catch (error) {
    log_('ERROR', 'list', String(error), {});
    const response = { ok: false, error: safeError_(error) };
    return callback ? jsonpResponse_(callback, response) : bridgeResponse_(requestId, response);
  }
}

function doPost(event) {
  const requestId = cleanRequestId_(event && event.parameter && event.parameter.requestId);
  try {
    const payload = JSON.parse((event && event.parameter && event.parameter.payload) || '{}');
    if (payload.action === 'nominate') {
      return bridgeResponse_(requestId, { ok: true, data: nominate_(payload) });
    }
    if (payload.action === 'delete') {
      deleteNominee_(payload);
      return bridgeResponse_(requestId, { ok: true });
    }
    throw new Error('Yêu cầu không hợp lệ.');
  } catch (error) {
    log_('ERROR', 'request', String(error), {});
    return bridgeResponse_(requestId, { ok: false, error: safeError_(error) });
  }
}

function nominate_(payload) {
  validateNomination_(payload);
  return withIndexLock_(function() {
    const folder = getFolder_();
    const index = readIndex_();
    if (index.items.length >= 300) throw new Error('Bảng Vàng đã đạt giới hạn lưu trữ của chiến dịch.');
    const codeHash = hashCode_(payload.code);
    const existing = index.items.find(function(item) {
      return item.codeHash === codeHash && item.fullName === cleanText_(payload.fullName, 42);
    });
    if (existing) return toPublicNominee_(existing);
    const sequence = index.nextSequence || 1;
    const prefix = String(sequence).padStart(3, '0') + '-' + slugify_(payload.fullName) + '-' + payload.code;
    const portraitName = prefix + '-portrait.jpg';
    const certificateName = prefix + '-vinh-danh.png';
    const existingPortraits = folder.getFilesByName(portraitName);
    const existingCertificates = folder.getFilesByName(certificateName);
    const portrait = existingPortraits.hasNext()
      ? existingPortraits.next()
      : folder.createFile(
          Utilities.newBlob(Utilities.base64Decode(payload.portraitBase64), 'image/jpeg', portraitName)
        );
    const certificate = existingCertificates.hasNext()
      ? existingCertificates.next()
      : folder.createFile(
          Utilities.newBlob(Utilities.base64Decode(payload.certificateBase64), 'image/png', certificateName)
        );

    const record = {
      id: Utilities.getUuid(),
      sequence: sequence,
      fullName: cleanText_(payload.fullName, 42),
      schoolName: cleanText_(payload.schoolName, 90),
      educationLevel: cleanEducationLevel_(payload.educationLevel),
      codeHash: codeHash,
      portraitFileId: portrait.getId(),
      certificateFileId: certificate.getId(),
      nominatedAt: new Date().toISOString()
    };

    index.nextSequence = sequence + 1;
    index.items.push(record);
    writeIndex_(index);
    log_('OK', 'nominate', 'Saved Golden Board nomination', {
      id: record.id,
      sequence: sequence,
      name: record.fullName
    });
    return toPublicNominee_(record);
  });
}

function deleteNominee_(payload) {
  const id = String(payload.id || '');
  const code = String(payload.code || '').toUpperCase();
  if (!id || !/^[A-Z]{4}$/.test(code)) throw new Error('Mã đề danh chưa chính xác.');

  withIndexLock_(function() {
    const index = readIndex_();
    const position = index.items.findIndex(function(item) { return item.id === id; });
    if (position < 0) throw new Error('Mã đề danh chưa chính xác.');
    const record = index.items[position];
    if (record.deleteLockedUntil && new Date(record.deleteLockedUntil).getTime() > Date.now()) {
      throw new Error('Đề danh đang tạm khóa xác nhận. Vui lòng thử lại sau 15 phút.');
    }
    if (record.codeHash !== hashCode_(code)) {
      record.failedDeleteAttempts = (Number(record.failedDeleteAttempts) || 0) + 1;
      if (record.failedDeleteAttempts >= 5) {
        record.deleteLockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        record.failedDeleteAttempts = 0;
      }
      writeIndex_(index);
      throw new Error('Mã đề danh chưa chính xác.');
    }

    [record.portraitFileId, record.certificateFileId].forEach(function(fileId) {
      try {
        DriveApp.getFileById(fileId).setTrashed(true);
      } catch (error) {
        log_('WARN', 'delete', 'Drive file was already unavailable', { fileId: fileId });
      }
    });
    index.items.splice(position, 1);
    writeIndex_(index);
    log_('OK', 'delete', 'Deleted Golden Board nomination', { id: id, name: record.fullName });
  });
}

function validateNomination_(payload) {
  if (!/^[A-Z]{4}$/.test(String(payload.code || ''))) throw new Error('Mã đề danh không hợp lệ.');
  if (!cleanText_(payload.fullName, 42) || !cleanText_(payload.schoolName, 90)) {
    throw new Error('Thông tin đề danh chưa đầy đủ.');
  }
  if (!payload.portraitBase64 || !payload.certificateBase64) throw new Error('Ảnh đề danh chưa đầy đủ.');
  if (payload.educationLevel && !/^(high-school|university)$/.test(String(payload.educationLevel))) {
    throw new Error('Cấp học đề danh không hợp lệ.');
  }
  if (String(payload.portraitBase64).length > 8 * 1024 * 1024 || String(payload.certificateBase64).length > 16 * 1024 * 1024) {
    throw new Error('Dung lượng ảnh đề danh vượt quá giới hạn.');
  }
}

function getFolder_() {
  const folderId = PropertiesService.getScriptProperties().getProperty(FOLDER_PROPERTY);
  if (!folderId) throw new Error('Chưa cấu hình thư mục lưu trữ Bảng Vàng.');
  return DriveApp.getFolderById(folderId);
}

function readIndex_() {
  const files = getFolder_().getFilesByName(INDEX_FILE_NAME);
  if (!files.hasNext()) return { nextSequence: 1, items: [] };
  const content = files.next().getBlob().getDataAsString('UTF-8');
  const parsed = JSON.parse(content || '{}');
  return {
    nextSequence: Number(parsed.nextSequence) || 1,
    items: Array.isArray(parsed.items) ? parsed.items : []
  };
}

function writeIndex_(index) {
  const folder = getFolder_();
  const files = folder.getFilesByName(INDEX_FILE_NAME);
  const content = JSON.stringify(index, null, 2);
  if (files.hasNext()) {
    files.next().setContent(content);
  } else {
    folder.createFile(INDEX_FILE_NAME, content, MimeType.PLAIN_TEXT);
  }
}

function withIndexLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function toPublicNominee_(record) {
  return {
    id: record.id,
    sequence: record.sequence,
    fullName: record.fullName,
    schoolName: record.schoolName,
    educationLevel: cleanEducationLevel_(record.educationLevel),
    portraitBase64: Utilities.base64Encode(
      DriveApp.getFileById(record.portraitFileId).getBlob().getBytes()
    ),
    nominatedAt: record.nominatedAt,
    storage: 'drive'
  };
}

function cleanEducationLevel_(value) {
  return String(value || '') === 'high-school' ? 'high-school' : 'university';
}

function hashCode_(code) {
  const properties = PropertiesService.getScriptProperties();
  let salt = properties.getProperty(SALT_PROPERTY);
  if (!salt) {
    salt = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty(SALT_PROPERTY, salt);
  }
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + ':' + String(code).toUpperCase(),
    Utilities.Charset.UTF_8
  );
  return digest.map(function(byte) {
    return ('0' + ((byte + 256) % 256).toString(16)).slice(-2);
  }).join('');
}

function cleanText_(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function slugify_(value) {
  return cleanText_(value, 42)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'hanh-trinh-toa-sang';
}

function bridgeResponse_(requestId, payload) {
  const message = {
    source: 'hanh-trinh-toa-sang',
    requestId: requestId,
    ok: payload.ok,
    data: payload.data,
    error: payload.error
  };
  const encoded = Utilities.base64Encode(JSON.stringify(message), Utilities.Charset.UTF_8);
  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8"><script>' +
    'top.postMessage(JSON.parse(decodeURIComponent(escape(atob("' + encoded + '")))), "*");' +
    '</script>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function jsonpResponse_(callback, payload) {
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function cleanCallback_(value) {
  const callback = String(value || '');
  return /^[A-Za-z_$][A-Za-z0-9_$]{0,90}$/.test(callback) ? callback : '';
}

function cleanRequestId_(value) {
  const requestId = String(value || '');
  return /^[a-f0-9-]{20,50}$/i.test(requestId) ? requestId : '';
}

function safeError_(error) {
  const message = error && error.message ? String(error.message) : 'Kho lưu trữ chưa thể xử lý yêu cầu.';
  return message.slice(0, 180);
}

function log_(level, step, message, context) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level,
    worker: 'apps-script',
    step: step,
    message: message,
    context: context || {}
  };
  console.log(JSON.stringify(entry));
}
