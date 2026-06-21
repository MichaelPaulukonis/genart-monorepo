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

  it('numbers frames continuously across bursts in one session', async () => {
    const { recorder, saved } = setup()
    recorder.toggleArm()

    recorder.onBurstStart()
    await recorder.captureFrame()
    await recorder.onBurstEnd()

    // No second toggleArm() — same session, counter continues.
    recorder.onBurstStart()
    await recorder.captureFrame()
    await recorder.onBurstEnd()

    expect(saved).toEqual([
      'dragline.burst-20260619120000.frame-0001.png',
      'dragline.burst-20260619120000.frame-0002.png'
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

  it('ignores onBurstStart while already recording (no mid-burst counter reset)', async () => {
    const { recorder, saved } = setup()
    recorder.toggleArm()
    recorder.onBurstStart()
    await recorder.captureFrame() // 0001
    recorder.onBurstStart() // mid-burst re-impulse must NOT reset the counter
    await recorder.captureFrame() // must be 0002, not 0001
    expect(saved).toEqual([
      'dragline.burst-20260619120000.frame-0001.png',
      'dragline.burst-20260619120000.frame-0002.png'
    ])
  })

  it('a new session (toggle off then on) restarts the frame counter and id', async () => {
    let n = 0
    const { recorder, saved } = setup({ datestring: () => `session${n}` })

    n = 1
    recorder.toggleArm() // session1 starts
    recorder.onBurstStart()
    await recorder.captureFrame()
    await recorder.captureFrame()
    await recorder.onBurstEnd()

    recorder.toggleArm() // off
    n = 2
    recorder.toggleArm() // session2 starts, counter resets
    recorder.onBurstStart()
    await recorder.captureFrame()

    expect(saved).toEqual([
      'dragline.burst-session1.frame-0001.png',
      'dragline.burst-session1.frame-0002.png',
      'dragline.burst-session2.frame-0001.png'
    ])
  })
})
