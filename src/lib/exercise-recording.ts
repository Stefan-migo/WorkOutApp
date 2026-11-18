import { EXERCISE_VIDEO_TYPES, MAX_EXERCISE_CLIP_BYTES } from './exercise-media'

export interface ClipRange { start: number; end: number }

export function createExerciseRecorder(stream: MediaStream, videoBitsPerSecond = 650_000) {
  const mimeType = ['video/mp4;codecs=avc1.42001E', 'video/mp4', 'video/webm;codecs=vp8', 'video/webm']
    .find((type) => MediaRecorder.isTypeSupported(type))
  if (!mimeType) throw new Error('This browser cannot record MP4 or WebM.')
  return new MediaRecorder(stream, { mimeType, videoBitsPerSecond })
}

export function recordingFile(recorder: MediaRecorder, chunks: Blob[]) {
  const type = (chunks[0]?.type || recorder.mimeType).split(';')[0] ?? ''
  const file = new File(chunks, type === 'video/mp4' ? 'demonstration.mp4' : 'demonstration.webm', { type })
  if (!EXERCISE_VIDEO_TYPES.has(type) || !file.size) throw new Error('No playable clip was captured. Try again.')
  if (file.size > MAX_EXERCISE_CLIP_BYTES) throw new Error('The clip exceeds 1 MB. Choose a shorter take.')
  return file
}

function seek(video: HTMLVideoElement, time: number) {
  if (Math.abs(video.currentTime - time) < 0.01 && !video.seeking) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      video.removeEventListener('seeked', done)
      reject(new Error('Could not seek to the selected start. Try adjusting the trim.'))
    }, 4000)
    function done() {
      window.clearTimeout(timeout)
      resolve()
    }
    video.addEventListener('seeked', done, { once: true })
    video.currentTime = time
  })
}

export async function trimExerciseRecording(video: HTMLVideoElement, range: ClipRange) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context || !canvas.captureStream || !video.videoWidth || !video.videoHeight) {
    throw new Error('Trimming is unavailable in this browser. Record a shorter take instead.')
  }
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  video.pause()
  await seek(video, range.start)

  const stream = canvas.captureStream(24)
  let frame = 0
  let timeout = 0
  try {
    return await new Promise<File>((resolve, reject) => {
      const recorder = createExerciseRecorder(stream)
      const chunks: Blob[] = []
      recorder.ondataavailable = ({ data }) => { if (data.size) chunks.push(data) }
      recorder.onerror = () => reject(new Error('Could not trim this take. Try again.'))
      recorder.onstop = () => {
        try { resolve(recordingFile(recorder, chunks)) }
        catch (error) { reject(error) }
      }

      function renderFrame() {
        if (video.ended || video.currentTime >= range.end) {
          if (recorder.state === 'recording') recorder.stop()
          return
        }
        context!.drawImage(video, 0, 0)
        frame = requestAnimationFrame(renderFrame)
      }

      recorder.start()
      context.drawImage(video, 0, 0)
      timeout = window.setTimeout(() => reject(new Error('The trim did not finish. Keep this screen open and try again.')), (range.end - range.start + 5) * 1000)
      video.play().then(renderFrame, reject)
    })
  } finally {
    window.clearTimeout(timeout)
    cancelAnimationFrame(frame)
    video.pause()
    stream.getTracks().forEach((track) => track.stop())
  }
}
