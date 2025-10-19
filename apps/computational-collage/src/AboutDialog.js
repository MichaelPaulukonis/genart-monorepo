/**
 * AboutDialog component for computational-collage
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
        <h2 id="about-dialog-title">About Computational Collage</h2>
        <div class="about-dialog-body">
          <p>An advanced generative art application for creating computational collages with multiple composition modes, image manipulation, and export capabilities.</p>
          <div class="about-dialog-controls">
            <h3>Key Controls</h3>
            <ul>
              <li><strong>0-9</strong><span>Switch between collage modes</span></li>
              <li><strong>G</strong><span>Toggle image gallery</span></li>
              <li><strong>S</strong><span>Save current composition</span></li>
              <li><strong>U</strong><span>Upload images</span></li>
              <li><strong>I</strong><span>Toggle parameter panel</span></li>
              <li><strong>Q</strong><span>Show this about dialog</span></li>
            </ul>
          </div>
          <div class="about-dialog-modes">
            <h3>Collage Modes</h3>
            <ul>
              <li><strong>Mode 0</strong><span>Image gallery</span></li>
              <li><strong>Mode 1</strong><span>Full-length strips</span></li>
              <li><strong>Mode 2</strong><span>Random chunks</span></li>
              <li><strong>Mode 3</strong><span>Circular arrangements</span></li>
              <li><strong>Mode 4</strong><span>Floating pixels</span></li>
              <li><strong>Mode 5</strong><span>Mondrian boxes</span></li>
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
