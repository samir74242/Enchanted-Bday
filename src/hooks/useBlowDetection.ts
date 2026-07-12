import { useState, useEffect, useRef } from 'react';

interface UseBlowDetectionProps {
  onBlowProgress: (progress: number) => void; // 0 to 1
  onBlowSuccess: () => void;
  threshold?: number; // threshold value (high vs low frequency ratio)
  enabled: boolean;
}

export const useBlowDetection = ({
  onBlowProgress,
  onBlowSuccess,
  threshold = 60,
  enabled
}: UseBlowDetectionProps) => {
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isActive, setIsActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const checkBlowTimeout = useRef<number | null>(null);

  // Maintain real-time blow intensity
  const blowIntensityRef = useRef<number>(0);

  const startListening = async () => {
    if (!enabled) return;
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setMicPermission('granted');

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      setIsActive(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let consecutiveBlowFrames = 0;

      const analyze = () => {
        if (!analyserRef.current || !isActive) {
          checkBlowTimeout.current = requestAnimationFrame(analyze);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);

        // Speech vs. Blowing analysis
        // Bins 0-15 cover frequencies under ~1400Hz (human vocals, background hums, bass)
        // Bins 25-180 cover frequencies ~2.3kHz - ~17kHz (high frequency white noise / sibilants / breathing / blowing)
        let lowFreqSum = 0;
        let highFreqSum = 0;

        for (let i = 0; i < 15; i++) {
          lowFreqSum += dataArray[i];
        }

        for (let i = 25; i < 180; i++) {
          highFreqSum += dataArray[i];
        }

        const avgLow = lowFreqSum / 15;
        const avgHigh = highFreqSum / 155;

        // Ratio of high frequency to low frequency
        // Blowing has a flat frequency response (white noise), meaning high frequencies are strong.
        // Speaking/singing has very high low frequencies (harmonics/vowels) and weak high frequencies.
        const ratio = avgHigh / (avgLow + 1);

        // Determine if blowing
        let isBlowing = false;
        let intensity = 0;

        // A valid blowing sound usually has high absolute energy in the upper frequencies, and a high high-to-low ratio
        if (avgHigh > 30 && ratio > 0.6) {
          isBlowing = true;
          // Scale intensity based on blow strength (30 to 120+)
          intensity = Math.min(1, (avgHigh - 30) / 90);
        }

        if (isBlowing) {
          consecutiveBlowFrames++;
          // Interpolate current blow intensity smoothly
          blowIntensityRef.current = blowIntensityRef.current * 0.7 + intensity * 0.3;
        } else {
          consecutiveBlowFrames = Math.max(0, consecutiveBlowFrames - 2);
          blowIntensityRef.current = blowIntensityRef.current * 0.8;
        }

        // Send progress report to callback
        onBlowProgress(blowIntensityRef.current);

        // Blow is successful if consecutive blowing happens for a few frames (~300ms)
        if (consecutiveBlowFrames > 8) {
          consecutiveBlowFrames = 0;
          onBlowSuccess();
        }

        checkBlowTimeout.current = requestAnimationFrame(analyze);
      };

      checkBlowTimeout.current = requestAnimationFrame(analyze);

    } catch (err: any) {
      console.warn('Microphone permission or initialisation failed', err);
      setMicPermission('denied');
      setErrorMsg('We need your microphone permission so you can blow the candles.');
      setIsActive(false);
    }
  };

  const stopListening = () => {
    setIsActive(false);
    blowIntensityRef.current = 0;
    onBlowProgress(0);

    if (checkBlowTimeout.current) {
      cancelAnimationFrame(checkBlowTimeout.current);
      checkBlowTimeout.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    if (enabled && isActive) {
      // already active
    } else if (!enabled) {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [enabled]);

  return {
    micPermission,
    isActive,
    errorMsg,
    startListening,
    stopListening,
  };
};
