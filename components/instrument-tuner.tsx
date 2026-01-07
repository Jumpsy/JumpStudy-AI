'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Settings } from 'lucide-react';

// Standard tunings for different instruments
const TUNINGS = {
  guitar: {
    name: 'Guitar (Standard)',
    notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    frequencies: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63],
  },
  'guitar-drop-d': {
    name: 'Guitar (Drop D)',
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    frequencies: [73.42, 110.00, 146.83, 196.00, 246.94, 329.63],
  },
  bass: {
    name: 'Bass (4-string)',
    notes: ['E1', 'A1', 'D2', 'G2'],
    frequencies: [41.20, 55.00, 73.42, 98.00],
  },
  'bass-5': {
    name: 'Bass (5-string)',
    notes: ['B0', 'E1', 'A1', 'D2', 'G2'],
    frequencies: [30.87, 41.20, 55.00, 73.42, 98.00],
  },
  ukulele: {
    name: 'Ukulele (Standard)',
    notes: ['G4', 'C4', 'E4', 'A4'],
    frequencies: [392.00, 261.63, 329.63, 440.00],
  },
  violin: {
    name: 'Violin',
    notes: ['G3', 'D4', 'A4', 'E5'],
    frequencies: [196.00, 293.66, 440.00, 659.25],
  },
};

interface InstrumentTunerProps {
  onClose?: () => void;
}

export default function InstrumentTuner({ onClose }: InstrumentTunerProps) {
  const [isListening, setIsListening] = useState(false);
  const [selectedTuning, setSelectedTuning] = useState<keyof typeof TUNINGS>('guitar');
  const [detectedFrequency, setDetectedFrequency] = useState<number | null>(null);
  const [detectedNote, setDetectedNote] = useState<string>('');
  const [cents, setCents] = useState<number>(0);
  const [selectedString, setSelectedString] = useState<number>(0);
  const [playingReference, setPlayingReference] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  async function startListening() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setIsListening(true);
      detectPitch();
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }

  function stopListening() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsListening(false);
    setDetectedFrequency(null);
    setDetectedNote('');
    setCents(0);
  }

  function detectPitch() {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);

    // Autocorrelation pitch detection
    const frequency = autoCorrelate(buffer, audioContextRef.current!.sampleRate);

    if (frequency > 0) {
      setDetectedFrequency(frequency);
      const { note, cents: centsOff } = frequencyToNote(frequency);
      setDetectedNote(note);
      setCents(centsOff);
    }

    animationFrameRef.current = requestAnimationFrame(detectPitch);
  }

  function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    // Find the best offset
    let size = buffer.length;
    let maxSamples = Math.floor(size / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    // Calculate RMS (volume)
    for (let i = 0; i < size; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / size);

    // Not enough signal
    if (rms < 0.01) return -1;

    // Find best correlation
    let lastCorrelation = 1;
    for (let offset = 1; offset < maxSamples; offset++) {
      let correlation = 0;

      for (let i = 0; i < maxSamples; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }

      correlation = 1 - correlation / maxSamples;

      if (correlation > 0.9 && correlation > lastCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }

      lastCorrelation = correlation;
    }

    if (bestCorrelation > 0.01) {
      return sampleRate / bestOffset;
    }

    return -1;
  }

  function frequencyToNote(frequency: number): { note: string; cents: number } {
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);

    const halfSteps = 12 * Math.log2(frequency / C0);
    const noteIndex = Math.round(halfSteps) % 12;
    const octave = Math.floor(halfSteps / 12);

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const note = noteNames[noteIndex] + octave;

    const cents = Math.floor((halfSteps - Math.round(halfSteps)) * 100);

    return { note, cents };
  }

  function playReferenceNote(stringIndex: number) {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const tuning = TUNINGS[selectedTuning];
    const frequency = tuning.frequencies[stringIndex];

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    osc.frequency.value = frequency;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      audioContextRef.current.currentTime + 2
    );

    osc.start();
    osc.stop(audioContextRef.current.currentTime + 2);

    setPlayingReference(true);
    setTimeout(() => setPlayingReference(false), 2000);
  }

  const tuning = TUNINGS[selectedTuning];
  const targetFrequency = tuning.frequencies[selectedString];
  const isTuned = Math.abs(cents) < 5;
  const isTooLow = cents < -5;
  const isTooHigh = cents > 5;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Volume2 className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Instrument Tuner</h2>
        <p className="text-gray-600">Tune your instrument with precision</p>
      </div>

      {/* Tuning Selection */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Select Tuning</label>
        <select
          value={selectedTuning}
          onChange={(e) => setSelectedTuning(e.target.value as keyof typeof TUNINGS)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none text-lg font-medium bg-white"
        >
          {Object.entries(TUNINGS).map(([key, tuning]) => (
            <option key={key} value={key}>
              {tuning.name}
            </option>
          ))}
        </select>
      </div>

      {/* String Selection */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Select String</label>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {tuning.notes.map((note, index) => (
            <button
              key={index}
              onClick={() => setSelectedString(index)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedString === index
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className="text-2xl font-bold text-purple-600">{note}</div>
              <div className="text-xs text-gray-600 mt-1">
                {tuning.frequencies[index].toFixed(2)} Hz
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Play Reference Note */}
      <button
        onClick={() => playReferenceNote(selectedString)}
        disabled={playingReference}
        className="w-full mb-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        <Volume2 className="w-5 h-5" />
        {playingReference ? 'Playing...' : `Play ${tuning.notes[selectedString]} Reference`}
      </button>

      {/* Tuning Display */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        {!isListening ? (
          <div className="text-center py-12">
            <Mic className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-6">
              Play the {tuning.notes[selectedString]} string to start tuning
            </p>
            <button
              onClick={startListening}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-2 mx-auto"
            >
              <Mic className="w-5 h-5" />
              Start Listening
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Detected Note */}
            <div className="text-center">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {detectedNote || '—'}
              </div>
              {detectedFrequency && (
                <div className="text-lg text-gray-600">
                  {detectedFrequency.toFixed(2)} Hz
                </div>
              )}
            </div>

            {/* Tuning Indicator */}
            <div className="relative h-24 bg-gray-100 rounded-xl overflow-hidden">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-300 z-10" />

              {/* Needle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-100"
                style={{
                  left: `calc(50% + ${Math.max(-50, Math.min(50, cents))}%)`,
                }}
              >
                <div
                  className={`w-2 h-20 rounded-full ${
                    isTuned
                      ? 'bg-green-500'
                      : isTooLow
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}
                />
              </div>

              {/* Labels */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-red-600">
                ♭ Too Low
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600">
                IN TUNE
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-yellow-600">
                Too High ♯
              </div>
            </div>

            {/* Cents Display */}
            <div className="text-center">
              <div
                className={`text-4xl font-bold ${
                  isTuned
                    ? 'text-green-600'
                    : isTooLow
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                {cents > 0 ? '+' : ''}
                {cents} ¢
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {isTuned
                  ? '✓ Perfect! String is in tune'
                  : isTooLow
                  ? '↑ Tighten string (tune up)'
                  : '↓ Loosen string (tune down)'}
              </div>
            </div>

            {/* Stop Button */}
            <button
              onClick={stopListening}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <MicOff className="w-5 h-5" />
              Stop Listening
            </button>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Tuning Tips
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Play one string at a time</li>
          <li>• Tune in a quiet environment</li>
          <li>• Cents: ±5 is acceptable, ±2 is perfect</li>
          <li>• Always tune UP to the note (from below)</li>
          <li>• Let the string ring out while tuning</li>
        </ul>
      </div>
    </div>
  );
}
