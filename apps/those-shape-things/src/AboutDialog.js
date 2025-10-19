/**
 * AboutDialog component for those-shape-things
 * Displays version information and app details in a modal dialog
 */

import { getFormattedVersion } from './utils/version.js'

export class AboutDialog {
  constructor () {
    this.dialog = null
    this.backdrop = null
    this.isVisible = false
    this.createDialog()
    this.setupEventListeners()
  }

  createDialog () {
    // Create backdrop
    this.backdrop = document.createElement('div')
    this.backdrop.className = 'about-dialog-backdrop'
    this.backdrop.style.display = 'none'

    // Create dialog container
    this.dialog = document.createElement('div')
    this.dialog.className = 'about-dialog'
    this.dialog.setAttribute('role', 'dialog')
    this.dialog.setAttribute('aria-modal', 'true')
    this.dialog.setAttribute('aria-labelledby', 'about-dialog-title')

    // Create dialog content
    this.dialog.innerHTML = `
      <div class="about-dialog-content">
        <h2 id="about-dialog-title">About Those Shape Things</h2>
        <div class="about-dialog-body">
          <p>A generative art application that creates geometric tile compositions with various patterns and color palettes.</p>
          <div class="about-dialog-controls">
            <h3>Controls</h3>
            <ul>
              <li><strong>Space / Click</strong><span>Generate new composition</span></li>
              <li><strong>B</strong><span>Toggle background color</span></li>
              <li><strong>I</strong><span>Show this about dialog</span></li>
            </ul>
          </div>
          <div class="about-dialog-version">
            <span id="about-version-info">Loading...</span>
          </div>
        </div>
        <div class="about-dialog-footer">
          <button id="about-dialog-close" class="about-dialog-close-btn">Close</button>
        </div>
      </div>
    `

    // Append to backdrop
    this.backdrop.appendChild(this.dialog)
    document.body.appendChild(this.backdrop)

    // Initialize version display
    this.initializeVersion()
  }

  async initializeVersion () {
    try {
      const version = await getFormattedVersion()
      const versionElement = document.getElementById('about-version-info')
      if (versionElement) {
        versionElement.textContent = version
      }
    } catch (error) {
      console.warn('Could not initialize version display:', error)
      const versionElement = document.getElementById('about-version-info')
      if (versionElement) {
        versionElement.textContent = 'v1.0.0'
      }
    }
  }

  setupEventListeners () {
    // Close button
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'about-dialog-close') {
        this.hide()
      }
    })

    // Backdrop click to close
    document.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.hide()
      }
    })

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide()
      }
    })
  }

  show () {
    if (!this.isVisible) {
      this.backdrop.style.display = 'flex'
      this.isVisible = true

      // Focus management for accessibility
      const closeButton = document.getElementById('about-dialog-close')
      if (closeButton) {
        closeButton.focus()
      }
    }
  }

  hide () {
    if (this.isVisible) {
      this.backdrop.style.display = 'none'
      this.isVisible = false
    }
  }

  toggle () {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }
}
