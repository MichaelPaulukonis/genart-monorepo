import { describe, it, expect } from 'vitest'
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

  it('toggleArm() flips armed and returns the new state', () => {
    const { recorder } = setup()
    expect(recorder.toggleArm()).toBe(true)
    expect(recorder.isArmed()).toBe(true)
    expect(recorder.toggleArm()).toBe(false)
    expect(recorder.isArmed()).toBe(false)
  })

  it('onBurstStart() records only when armed, and keeps armed on', () => {
    const { recorder } = setup()
    recorder.onBurstStart()
    expect(recorder.isRecording()).toBe(false)

    recorder.toggleArm()
    recorder.onBurstStart()
    expect(recorder.isRecording()).toBe(true)
    expect(recorder.isArmed()).toBe(true)
  })

  it('captureFrame() is a no-op when not recording', async () => {
    const { recorder, saved } = setup()
    await recorder.captureFrame()
    expect(saved).toEqual([])
  })

  it('captureFrame() saves padded, sequenced filenames while recording', async () => {
    const { recorder, saved } = setup()
    recorder.toggleArm()
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
    recorder.toggleArm()
    recorder.onBurstStart()
    expect(recorder.frameCount()).toBe(0)
    await recorder.captureFrame()
    expect(recorder.frameCount()).toBe(1)
  })

  it('onBurstEnd() stops recording but leaves record mode armed', async () => {
    const { recorder } = setup()
    recorder.toggleArm()
    recorder.onBurstStart()
    await recorder.onBurstEnd()
    expect(recorder.isRecording()).toBe(false)
    expect(recorder.isArmed()).toBe(true)
  })

  it('records subsequent bursts without re-arming (record mode persists)', async () => {
    const { recorder, saved } = setup()
    recorder.toggleArm()

    recorder.onBurstStart()
    await recorder.captureFrame()
    await recorder.onBurstEnd()

    // No second toggleArm() — record mode is still on.
    recorder.onBurstStart()
    await recorder.captureFrame()
    await recorder.onBurstEnd()

    expect(saved).toEqual([
      'dragline.burst-20260619120000.frame-0001.png',
      'dragline.burst-20260619120000.frame-0001.png'
    ])
  })

  it('stops recording new bursts once toggled off', async () => {
    const { recorder, saved } = setup()
    recorder.toggleArm()
    recorder.toggleArm() // off

    recorder.onBurstStart()
    await recorder.captureFrame()
    expect(saved).toEqual([])
  })

  it('a fresh burst restarts the frame counter', async () => {
    const { recorder, saved } = setup()
    recorder.toggleArm()
    recorder.onBurstStart()
    await recorder.captureFrame()
    await recorder.onBurstEnd()
    recorder.onBurstStart()
    await recorder.captureFrame()
    expect(saved[saved.length - 1]).toBe('dragline.burst-20260619120000.frame-0001.png')
  })
})
