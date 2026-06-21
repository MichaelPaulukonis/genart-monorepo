// Records every frame of a movement burst as a numbered PNG sequence.
//
// DOM-agnostic and dependency-injected for testability. dragline.js supplies
// renderCleanFrame (returns a PNG dataURL), datestring (burst id), and save
// (persists one frame). The p5 draw loop drives onBurstStart / captureFrame /
// onBurstEnd; key handling drives toggleArm.

const MAX_IN_FLIGHT = 4

export function createBurstRecorder ({ renderCleanFrame, datestring, save }) {
  let armed = false
  let recording = false
  let burstId = ''
  let frameIndex = 0
  const queue = []
  let inFlight = 0

  function pad (n) {
    return String(n).padStart(4, '0')
  }

  function drain () {
    while (inFlight < MAX_IN_FLIGHT && queue.length > 0) {
      const job = queue.shift()
      inFlight += 1
      Promise.resolve(save(job.dataURL, job.filename))
        .catch(e => console.warn('[burst-recorder] frame save failed:', e && e.message))
        .finally(() => {
          inFlight -= 1
          drain()
        })
    }
  }

  return {
    // Toggle persistent record mode. While on, every burst records until
    // toggled off again. Returns the new state.
    toggleArm () { armed = !armed; return armed },
    isArmed: () => armed,
    isRecording: () => recording,
    frameCount: () => frameIndex,

    onBurstStart () {
      if (!armed) return
      recording = true
      burstId = datestring()
      frameIndex = 0
    },

    captureFrame () {
      if (!recording) return
      frameIndex += 1
      const dataURL = renderCleanFrame()
      const filename = `dragline.burst-${burstId}.frame-${pad(frameIndex)}.png`
      queue.push({ dataURL, filename })
      drain()
    },

    onBurstEnd () {
      recording = false
      drain()
    }
  }
}
