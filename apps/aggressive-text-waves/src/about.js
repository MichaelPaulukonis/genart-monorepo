import { version } from '../package.json'

const ABOUT_SEEN_KEY = 'aggressive-text-waves_about_seen'

function createModal (id) {
  const el = document.getElementById(id)
  if (!el) return null

  let isDragging = false
  let startX; let startY; let offsetX = 0; let offsetY = 0

  el.addEventListener('mousedown', (e) => {
    if (['INPUT', 'BUTTON', 'A'].includes(e.target.tagName)) return
    isDragging = true
    startX = e.clientX - offsetX
    startY = e.clientY - offsetY
    e.stopPropagation()
  })

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return
    e.preventDefault()
    offsetX = e.clientX - startX
    offsetY = e.clientY - startY
    el.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`
  })

  document.addEventListener('mouseup', () => { isDragging = false })

  ;['mousedown', 'touchstart', 'pointerdown'].forEach(evt => {
    el.addEventListener(evt, (e) => e.stopPropagation(), evt === 'touchstart' ? { passive: false } : undefined)
  })

  const instance = {
    show () { el.classList.remove('hidden') },
    hide () { el.classList.add('hidden') },
    toggle () { instance.isVisible() ? instance.hide() : instance.show() },
    isVisible () { return !el.classList.contains('hidden') }
  }

  const closeBtn = el.querySelector('.close-button')
  if (closeBtn) closeBtn.addEventListener('click', () => instance.hide())

  return instance
}

const aboutModal = createModal('about-box')

if (aboutModal) {
  const versionEl = document.querySelector('#about-box .version-text')
  if (versionEl) versionEl.textContent = `v${version}`

  try {
    if (!localStorage.getItem(ABOUT_SEEN_KEY)) {
      aboutModal.show()
      localStorage.setItem(ABOUT_SEEN_KEY, '1')
    }
  } catch (e) {
    // localStorage unavailable
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && aboutModal && aboutModal.isVisible()) {
    aboutModal.hide()
  }
})

window.aboutControls = {
  toggle: () => aboutModal && aboutModal.toggle(),
  show: () => aboutModal && aboutModal.show(),
  hide: () => aboutModal && aboutModal.hide()
}
