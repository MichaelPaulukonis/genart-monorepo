export function createTextModal () {
  let savedText = ''

  function open () {
    return new Promise((resolve) => {
      const overlay = document.createElement('div')
      overlay.className = 'text-modal-overlay'
      overlay.innerHTML = `
        <div class="text-modal-content">
          <div class="text-modal-header">
            <h3>Enter Text</h3>
            <button data-action="close">✕</button>
          </div>
          <textarea class="text-modal-textarea" placeholder="Paste or type text here..."></textarea>
          <div class="text-modal-footer">
            <button data-action="submit">Set Text</button>
            <button data-action="cancel">Cancel</button>
          </div>
        </div>
      `

      overlay.querySelector('.text-modal-textarea').value = savedText

      function close (value) {
        overlay.remove()
        resolve(value)
      }

      overlay.addEventListener('keydown', (e) => {
        e.stopPropagation()
        if (e.key === 'Escape') close(null)
      })

      overlay.addEventListener('click', (e) => {
        const action = e.target.dataset.action
        if (action === 'submit') {
          const text = overlay.querySelector('.text-modal-textarea').value.trim()
          if (text) savedText = text
          close(text || null)
        } else if (action === 'cancel' || action === 'close') {
          close(null)
        }
      })

      document.body.appendChild(overlay)
      overlay.querySelector('.text-modal-textarea').focus()
    })
  }

  return { open }
}
