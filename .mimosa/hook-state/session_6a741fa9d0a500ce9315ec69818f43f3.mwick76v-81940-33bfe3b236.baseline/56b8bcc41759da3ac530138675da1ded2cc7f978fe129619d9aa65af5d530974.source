/**
 * @file audio-analysis.worker.ts
 * @description Web Worker for high-performance audio analysis
 * Runs frequency/waveform analysis in background thread to avoid blocking UI
 */

interface AnalysisMessage {
  type: 'ANALYZE' | 'CONFIGURE' | 'STOP'
  data?: {
    frequencyData?: Uint8Array
    waveformData?: Uint8Array
    fftSize?: number
    sampleRate?: number
  }
}

self.onmessage = (e: MessageEvent<AnalysisMessage>) => {
  const { type, data } = e.data

  switch (type) {
    case 'ANALYZE':
      if (data?.frequencyData && data?.waveformData) {
        const analysisResult = performAnalysis(data.frequencyData, data.waveformData)
        
        ;(self as unknown as Worker).postMessage({
          type: 'ANALYSIS_RESULT',
          data: analysisResult
        })
      }
      break

    case 'CONFIGURE':
      if (data?.fftSize) {
        // console.log(`[AudioWorker] Configured with FFT size: ${data.fftSize}`)
      }
      break

    case 'STOP':
      self.close()
      break

    default:
      console.warn('[AudioWorker] Unknown message type:', type)
  }
}

function performAnalysis(
  frequencyData: Uint8Array,
  waveformData: Uint8Array
): {
  energy: number
  bassEnergy: number
  midEnergy: number
  trebleEnergy: number
  peakFrequency: number
  spectralCentroid: number
  rms: number
  zcr: number
} {
  const binCount = frequencyData.length
  
  let totalSum = 0
  let bassSum = 0
  let midSum = 0
  let trebleSum = 0
  let maxAmplitude = 0
  let peakBin = 0
  let weightedSum = 0
  let magnitudeSum = 0
  let waveSquaredSum = 0
  let zeroCrossings = 0

  const bassEnd = Math.floor(binCount * 0.15)
  const midEnd = Math.floor(binCount * 0.6)

  for (let i = 0; i < binCount; i++) {
    const freq = frequencyData[i]
    totalSum += freq

    if (i < bassEnd) {
      bassSum += freq
    } else if (i < midEnd) {
      midSum += freq
    } else {
      trebleSum += freq
    }

    if (freq > maxAmplitude) {
      maxAmplitude = freq
      peakBin = i
    }

    weightedSum += i * freq
    magnitudeSum += freq
  }

  for (let i = 1; i < waveformData.length; i++) {
    const current = (waveformData[i] - 128) / 128
    const previous = (waveformData[i - 1] - 128) / 128
    
    waveSquaredSum += current * current
    
    if ((current >= 0 && previous < 0) || (current < 0 && previous >= 0)) {
      zeroCrossings++
    }
  }

  return {
    energy: totalSum / (binCount * 255),
    bassEnergy: bassSum / (bassEnd * 255),
    midEnergy: midSum / ((midEnd - bassEnd) * 255),
    trebleEnergy: trebleSum / ((binCount - midEnd) * 255),
    peakFrequency: peakBin,
    spectralCentroid: magnitudeSum > 0 ? weightedSum / magnitudeSum : 0,
    rms: Math.sqrt(waveSquaredSum / waveformData.length),
    zcr: zeroCrossings / waveformData.length
  }
}
