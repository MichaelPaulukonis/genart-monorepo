// Records frames of movement bursts as a numbered PNG sequence.
//
// A "session" runs from when recording is toggled on until it is toggled off.
// All bursts within a session share one id and a single continuous frame
// counter, so the whole session stitches together as one sequence.
//
// DOM-agnostic and dependency-injected for testability. dragline.js supplies
// renderCleanFrame (returns a PNG dataURL), datestring (session id), and save
// (persists one frame). The p5 draw loop drives onBurstStart / captureFrame /
// onBurstEnd; key handling drives toggleArm.

const MAX_IN_FLIGHT = 4

export function createBurstRecorder ({ renderCleanFrame, datestring, save }) {
  let armed = false
  let recording = false
  let sessionId = ''
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
    // Toggle record mode. Turning on starts a new session: fresh id + frame
    // counter. While on, every burst appends to the same continuous sequence
    // until toggled off. Returns the new state.
    toggleArm () {
      armed = !armed
      if (armed) {
        // sessionId is second-resolution. Two sessions started within the same
        // wall-clock second would collide and the later one would overwrite the
        // earlier frames. Left unhandled: reaching it requires toggling REC off
        // then on inside one second.
        sessionId = datestring()
        frameIndex = 0
      }
      return armed
    },
    isArmed: () => armed,
    isRecording: () => recording,
    frameCount: () => frameIndex,

    onBurstStart () {
      // Begin recording this burst into the current session. Deliberately does
      // not touch sessionId or frameIndex, so frames number continuously across
      // every burst until the session ends.
      if (!armed) return
      recording = true
    },

    captureFrame () {
      if (!recording) return
      frameIndex += 1
      const dataURL = renderCleanFrame()
      const filename = `dragline.burst-${sessionId}.frame-${pad(frameIndex)}.png`
      queue.push({ dataURL, filename })
      drain()
    },

    onBurstEnd () {
      recording = false
      drain()
    }
  }
}
