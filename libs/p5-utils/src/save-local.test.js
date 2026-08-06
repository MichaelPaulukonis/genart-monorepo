import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveDataURLWithFallback, checkServer, isServerAvailable, __resetServerState } from './save-local.js'

const DATA_URL = 'data:image/png;base64,AAAA'

describe('save-local saveDataURLWithFallback', () => {
  beforeEach(() => {
    __resetServerState()
    vi.restoreAllMocks()
  })

  it('POSTs to server when server is available', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    const download = vi.fn()
    await checkServer()
    await saveDataURLWithFallback(DATA_URL, 'frame-0001.png', { download })

    expect(isServerAvailable()).toBe(true)
    expect(download).not.toHaveBeenCalled()
    const saveCall = fetchMock.mock.calls.find(c => String(c[0]).endsWith('/save'))
    expect(saveCall).toBeTruthy()
    expect(JSON.parse(saveCall[1].body)).toMatchObject({ dataURL: DATA_URL, filename: 'frame-0001.png' })
  })

  it('falls back to download when server is unavailable', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('refused'))
    vi.stubGlobal('fetch', fetchMock)

    const download = vi.fn()
    await checkServer()
    await saveDataURLWithFallback(DATA_URL, 'frame-0001.png', { download })

    expect(isServerAvailable()).toBe(false)
    expect(download).toHaveBeenCalledWith(DATA_URL, 'frame-0001.png')
  })

  it('falls back to download when POST fails mid-session', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error('boom'))
    vi.stubGlobal('fetch', fetchMock)

    const download = vi.fn()
    await checkServer()
    await saveDataURLWithFallback(DATA_URL, 'frame-0001.png', { download })

    expect(download).toHaveBeenCalledWith(DATA_URL, 'frame-0001.png')
    expect(isServerAvailable()).toBe(false)
  })
})
