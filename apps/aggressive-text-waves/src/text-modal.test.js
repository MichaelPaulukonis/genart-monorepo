import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTextModal } from './text-modal.js'

describe('createTextModal', () => {
  let modal

  beforeEach(() => {
    modal = createTextModal()
  })

  afterEach(() => {
    document.querySelector('.text-modal-overlay')?.remove()
  })

  it('open() returns a Promise', () => {
    const result = modal.open()
    expect(result).toBeInstanceOf(Promise)
    document.querySelector('[data-action="cancel"]').click()
    return result
  })

  it('appends overlay to body when opened', () => {
    modal.open()
    expect(document.querySelector('.text-modal-overlay')).not.toBeNull()
    document.querySelector('[data-action="cancel"]').click()
  })

  it('contains a textarea', () => {
    modal.open()
    expect(document.querySelector('.text-modal-textarea')).not.toBeNull()
    document.querySelector('[data-action="cancel"]').click()
  })

  it('resolves with trimmed text on submit', async () => {
    const promise = modal.open()
    document.querySelector('.text-modal-textarea').value = '  hello world  '
    document.querySelector('[data-action="submit"]').click()
    expect(await promise).toBe('hello world')
  })

  it('resolves with null on cancel', async () => {
    const promise = modal.open()
    document.querySelector('[data-action="cancel"]').click()
    expect(await promise).toBeNull()
  })

  it('resolves with null on close button', async () => {
    const promise = modal.open()
    document.querySelector('[data-action="close"]').click()
    expect(await promise).toBeNull()
  })

  it('resolves with null on empty submit', async () => {
    const promise = modal.open()
    document.querySelector('.text-modal-textarea').value = '   '
    document.querySelector('[data-action="submit"]').click()
    expect(await promise).toBeNull()
  })

  it('removes overlay from DOM after submit', async () => {
    const promise = modal.open()
    document.querySelector('.text-modal-textarea').value = 'text'
    document.querySelector('[data-action="submit"]').click()
    await promise
    expect(document.querySelector('.text-modal-overlay')).toBeNull()
  })

  it('removes overlay from DOM after cancel', async () => {
    const promise = modal.open()
    document.querySelector('[data-action="cancel"]').click()
    await promise
    expect(document.querySelector('.text-modal-overlay')).toBeNull()
  })

  it('pre-populates textarea with previously submitted text', async () => {
    const promise1 = modal.open()
    document.querySelector('.text-modal-textarea').value = 'my saved text'
    document.querySelector('[data-action="submit"]').click()
    await promise1

    modal.open()
    expect(document.querySelector('.text-modal-textarea').value).toBe('my saved text')
    document.querySelector('[data-action="cancel"]').click()
  })

  it('keydown events do not propagate past the overlay', async () => {
    const promise = modal.open()
    const docListener = vi.fn()
    document.addEventListener('keydown', docListener)

    const textarea = document.querySelector('.text-modal-textarea')
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }))

    expect(docListener).not.toHaveBeenCalled()
    document.removeEventListener('keydown', docListener)
    document.querySelector('[data-action="cancel"]').click()
    await promise
  })
})
