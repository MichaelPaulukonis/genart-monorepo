/**
 * Creates the history capture, navigation, and feedback system.
 *
 * @param {object} deps
 * @param {Function} deps.getHistoryManager - returns current historyManager (may be null early on)
 * @param {Function} deps.getFilmstripPanel  - returns current filmstripPanel (may be null early on)
 * @param {Function} deps.getCanvas          - returns p.canvas
 * @param {number}   deps.CAPTURE_DEBOUNCE_DELAY
 */
export function createHistoryController ({
  getHistoryManager,
  getFilmstripPanel,
  getCanvas,
  CAPTURE_DEBOUNCE_DELAY
}) {
  let captureDebounceTimer = null

  // ── private feedback helpers ────────────────────────────────────────────────

  function showHistoryNavigationFeedback (message, type = 'normal') {
    let feedback = document.getElementById('history-navigation-feedback')
    if (!feedback) {
      feedback = document.createElement('div')
      feedback.id = 'history-navigation-feedback'
      feedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: white;
        z-index: 10000;
        transition: opacity 0.3s ease;
        pointer-events: none;
        white-space: nowrap;
      `
      document.body.appendChild(feedback)
    }
    feedback.style.backgroundColor = type === 'boundary' ? '#ff9800' : 'rgba(0, 0, 0, 0.8)'
    feedback.textContent = message
    feedback.style.opacity = '1'
    setTimeout(() => {
      feedback.style.opacity = '0'
      setTimeout(() => { if (feedback.parentNode) feedback.parentNode.removeChild(feedback) }, 300)
    }, 2000)
  }

  function provideHistoryBoundsFeedback (boundType) {
    const canvas = getCanvas()
    const originalStyle = canvas.style.border
    canvas.style.border = '3px solid #ff9800'
    setTimeout(() => { canvas.style.border = originalStyle }, 200)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(boundType === 'beginning' ? 300 : 500, audioContext.currentTime)
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.log('Audio feedback not available:', error.message)
    }
  }

  function showClearHistoryFeedback (message, type = 'success') {
    let feedback = document.getElementById('clear-history-feedback')
    if (!feedback) {
      feedback = document.createElement('div')
      feedback.id = 'clear-history-feedback'
      feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 16px 24px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 16px;
        font-weight: 500;
        color: white;
        z-index: 10000;
        transition: opacity 0.3s ease;
        pointer-events: none;
        text-align: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      `
      document.body.appendChild(feedback)
    }
    feedback.style.backgroundColor = type === 'error' ? '#d32f2f' : '#4CAF50'
    feedback.textContent = message
    feedback.style.opacity = '1'
    setTimeout(() => {
      feedback.style.opacity = '0'
      setTimeout(() => { if (feedback.parentNode) feedback.parentNode.removeChild(feedback) }, 300)
    }, 2500)
  }

  function updateFilmstripAfterNav () {
    const fp = getFilmstripPanel()
    if (fp && fp.isVisible) {
      fp.updateHighlight()
      fp.updateCounter()
      fp.scrollToCurrentPosition()
    }
  }

  // ── public API ───────────────────────────────────────────────────────────────

  function captureDebounced (source = 'manual') {
    const hm = getHistoryManager()
    if (!hm) return
    if (captureDebounceTimer) clearTimeout(captureDebounceTimer)
    captureDebounceTimer = setTimeout(() => {
      hm.captureCurrentState(source)
      captureDebounceTimer = null
      const fp = getFilmstripPanel()
      if (fp && fp.isVisible) fp.update()
    }, CAPTURE_DEBOUNCE_DELAY)
  }

  function captureImmediate (source = 'manual') {
    const hm = getHistoryManager()
    if (!hm) return
    if (captureDebounceTimer) {
      clearTimeout(captureDebounceTimer)
      captureDebounceTimer = null
    }
    hm.captureCurrentState(source)
    const fp = getFilmstripPanel()
    if (fp && fp.isVisible) fp.update()
  }

  function navigateBackward (step = 1) {
    const hm = getHistoryManager()
    if (!hm) { console.warn('History manager not initialized'); return }
    let actualSteps = 0
    for (let i = 0; i < step; i++) {
      if (hm.navigateBackward()) actualSteps++
      else break
    }
    if (actualSteps > 0) {
      const currentPos = hm.getCurrentPosition() + 1
      const total = hm.getTotalEntries()
      const stepText = actualSteps > 1 ? ` (-${actualSteps})` : ''
      showHistoryNavigationFeedback(`History: ${currentPos} / ${total}${stepText}`)
      updateFilmstripAfterNav()
    } else {
      showHistoryNavigationFeedback('At beginning of history', 'boundary')
      provideHistoryBoundsFeedback('beginning')
    }
  }

  function navigateForward (step = 1) {
    const hm = getHistoryManager()
    if (!hm) { console.warn('History manager not initialized'); return }
    let actualSteps = 0
    for (let i = 0; i < step; i++) {
      if (hm.navigateForward()) actualSteps++
      else break
    }
    if (actualSteps > 0) {
      const currentPos = hm.getCurrentPosition() + 1
      const total = hm.getTotalEntries()
      const stepText = actualSteps > 1 ? ` (+${actualSteps})` : ''
      showHistoryNavigationFeedback(`History: ${currentPos} / ${total}${stepText}`)
      updateFilmstripAfterNav()
    } else {
      showHistoryNavigationFeedback('At end of history', 'boundary')
      provideHistoryBoundsFeedback('end')
    }
  }

  function navigateToBeginning () {
    const hm = getHistoryManager()
    if (!hm) { console.warn('History manager not initialized'); return }
    const total = hm.getTotalEntries()
    if (total === 0) { showHistoryNavigationFeedback('History is empty', 'boundary'); return }
    if (hm.navigateTo(0)) {
      showHistoryNavigationFeedback(`History: 1 / ${total} (beginning)`)
      updateFilmstripAfterNav()
    }
  }

  function navigateToEnd () {
    const hm = getHistoryManager()
    if (!hm) { console.warn('History manager not initialized'); return }
    const total = hm.getTotalEntries()
    if (total === 0) { showHistoryNavigationFeedback('History is empty', 'boundary'); return }
    const lastPos = total - 1
    if (hm.navigateTo(lastPos)) {
      showHistoryNavigationFeedback(`History: ${total} / ${total} (end)`)
      updateFilmstripAfterNav()
    }
  }

  function toggleFilmstrip () {
    const fp = getFilmstripPanel()
    if (!fp) { console.warn('Filmstrip panel not initialized'); return }
    fp.toggle()
    if (fp.isVisible) fp.update()
  }

  function regenerateThumbnails () {
    const hm = getHistoryManager()
    if (!hm) { console.warn('History manager not initialized'); return }
    hm.thumbnailGenerator.clearCache()
    console.log('Thumbnail cache cleared - thumbnails will regenerate')
    const fp = getFilmstripPanel()
    if (fp && fp.isVisible) {
      fp.scrollContainer.innerHTML = ''
      fp.renderedCount = 0
      fp.renderedThumbnails.clear()
      fp.update()
    }
    showClearHistoryFeedback('Thumbnails regenerated', 'success')
  }

  function clearHistory () {
    const hm = getHistoryManager()
    if (!hm) { console.warn('History manager not initialized'); return }
    const total = hm.getTotalEntries()
    const success = hm.clearHistory()
    if (success) {
      console.log(`Cleared ${total} history entries`)
      const fp = getFilmstripPanel()
      if (fp) {
        fp.scrollContainer.innerHTML = ''
        fp.renderedCount = 0
        if (fp.isVisible) fp.update()
      }
      showClearHistoryFeedback(`History cleared (${total} entries removed)`)
    } else {
      console.error('Failed to clear history')
      showClearHistoryFeedback('Failed to clear history', 'error')
    }
  }

  function showClearHistoryDialog (onConfirm) {
    const hm = getHistoryManager()
    if (!hm) { console.warn('History manager not initialized'); return }
    const dialog = document.getElementById('clear-history-dialog')
    if (!dialog) { console.error('Clear history dialog not found'); return }
    const cancelBtn = document.getElementById('clear-history-cancel')
    const confirmBtn = document.getElementById('clear-history-confirm')
    if (!cancelBtn || !confirmBtn) { console.error('Clear history dialog buttons not found'); return }

    const cleanup = () => {
      cancelBtn.removeEventListener('click', handleCancel)
      confirmBtn.removeEventListener('click', handleConfirm)
      document.removeEventListener('keydown', handleEscape)
      dialog.removeEventListener('click', handleBackdropClick)
    }
    const handleCancel = (event) => {
      if (event) { event.stopPropagation(); event.preventDefault() }
      dialog.classList.add('hidden')
      cleanup()
    }
    const handleConfirm = (event) => {
      if (event) { event.stopPropagation(); event.preventDefault() }
      dialog.classList.add('hidden')
      cleanup()
      if (onConfirm) onConfirm()
      else clearHistory()
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); handleCancel(e) }
    }
    const handleBackdropClick = (event) => {
      if (event.target === dialog) handleCancel(event)
    }

    cancelBtn.addEventListener('click', handleCancel)
    confirmBtn.addEventListener('click', handleConfirm)
    document.addEventListener('keydown', handleEscape)
    dialog.addEventListener('click', handleBackdropClick)
    dialog.classList.remove('hidden')
  }

  return {
    captureDebounced,
    captureImmediate,
    navigateBackward,
    navigateForward,
    navigateToBeginning,
    navigateToEnd,
    toggleFilmstrip,
    regenerateThumbnails,
    showClearHistoryDialog,
    clearHistory
  }
}
