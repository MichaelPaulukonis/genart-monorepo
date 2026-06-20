import { describe, it, expect, vi } from 'vitest'
import { createBurstRecorder } from './burst-recorder.js'

function setup (overrides = {}) {
  const saved = []
  const recorder = createBurstRecorder({
    renderCleanFrame: () => 'data:image/png;base64,FRAME',
    datestring: () => '20260619120000',
    save: async (dataURL, filename) => { saved.push(filename) },
    ...overrides
  })
  return { recorder, saved }
}

describe('burst-recorder state', () => {
  it('starts idle: not armed, not recording', () => {
    const { recorder } = setup()
    expect(recorder.isArmed()).toBe(false)
    expect(recorder.isRecording()).toBe(false)
  })

  it('arm() sets armed', () => {
    const { recorder } = setup()
    recorder.arm()
    expect(recorder.isArmed()).toBe(true)
  })

  it('onBurstStart() records only when armed, and clears armed', () => {
    const { recorder } = setup()
    recorder.onBurstStart()
    expect(recorder.isRecording()).toBe(false)

    recorder.arm()
    recorder.onBurstStart()
    expect(recorder.isRecording()).toBe(true)
    expect(recorder.isArmed()).toBe(false)
  })

  it('captureFrame() is a no-op when not recording', async () => {
    const { recorder, saved } = setup()
    await recorder.captureFrame()
    expect(saved).toEqual([])
  })

  it('captureFrame() saves padded, sequenced filenames while recording', async () => {
    const { recorder, saved } = setup()
    recorder.arm()
    recorder.onBurstStart()
    await recorder.captureFrame()
    await recorder.captureFrame()
    await recorder.onBurstEnd()
    expect(saved).toEqual([
      'dragline.burst-20260619120000.frame-0001.png',
      'dragline.burst-20260619120000.frame-0002.png'
    ])
  })

  it('frameCount() reflects captured frames', async () => {
    const { recorder } = setup()
    recorder.arm()
    recorder.onBurstStart()
    expect(recorder.frameCount()).toBe(0)
    await recorder.captureFrame()
    expect(recorder.frameCount()).toBe(1)
  })

  it('onBurstEnd() stops recording', async () => {
    const { recorder } = setup()
    recorder.arm()
    recorder.onBurstStart()
    await recorder.onBurstEnd()
    expect(recorder.isRecording()).toBe(false)
  })

  it('a fresh burst restarts the frame counter', async () => {
    const { recorder, saved } = setup()
    recorder.arm(); recorder.onBurstStart()
    await recorder.captureFrame()
    await recorder.onBurstEnd()
    recorder.arm(); recorder.onBurstStart()
    await recorder.captureFrame()
    expect(saved[saved.length - 1]).toBe('dragline.burst-20260619120000.frame-0001.png')
  })
})
