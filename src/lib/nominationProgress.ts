export function nextWaitingProgress(current: number) {
  return Math.min(88, current + 1)
}

export function acceleratedCompletionProgress(startValue: number, elapsed: number) {
  const safeStart = Math.min(100, Math.max(0, startValue))
  const safeElapsed = Math.min(1, Math.max(0, elapsed))
  return Math.min(100, Math.round(safeStart + (100 - safeStart) * safeElapsed ** 1.65))
}
