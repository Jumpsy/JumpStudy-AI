'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, Play, Trash2, Upload } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcript?: string) => void;
  onScheduleDetected?: (scheduleInfo: any) => void;
}

export default function AudioRecorder({
  onRecordingComplete,
  onScheduleDetected,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }

  function pauseRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }

  function resumeRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }

  function deleteRecording() {
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
    chunksRef.current = [];
  }

  async function transcribeAndUpload() {
    if (!audioBlob) return;

    setIsTranscribing(true);

    try {
      // Convert audio to base64 for sending to API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.transcript) {
        // Check if this is a lecture recording
        const isLecture = checkIfLecture(data.transcript);

        if (isLecture && onScheduleDetected) {
          // Try to extract schedule information
          const scheduleInfo = extractScheduleInfo(data.transcript);
          if (scheduleInfo) {
            onScheduleDetected(scheduleInfo);
          }
        }

        onRecordingComplete(audioBlob, data.transcript);

        // Reset
        deleteRecording();
      } else {
        alert(data.error || 'Failed to transcribe audio');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  }

  function checkIfLecture(transcript: string): boolean {
    const lectureKeywords = [
      'today we',
      'chapter',
      'lesson',
      'assignment',
      'homework',
      'exam',
      'quiz',
      'lecture',
      'professor',
      'class',
    ];

    const lowerTranscript = transcript.toLowerCase();
    return lectureKeywords.some((keyword) => lowerTranscript.includes(keyword));
  }

  function extractScheduleInfo(transcript: string): any | null {
    // Simple extraction of course info
    // This could be enhanced with better NLP
    const coursePattern = /(math|english|science|history|biology|chemistry|physics|literature)/i;
    const courseMatch = transcript.match(coursePattern);

    if (courseMatch) {
      return {
        subject: courseMatch[1],
        timestamp: new Date().toISOString(),
        transcript: transcript,
      };
    }

    return null;
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="font-semibold text-gray-900">
            {isRecording ? 'Recording...' : 'Audio Recorder'}
          </span>
        </div>
        <div className="text-lg font-mono font-bold text-red-600">
          {formatTime(recordingTime)}
        </div>
      </div>

      {!isRecording && !audioBlob && (
        <button
          onClick={startRecording}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <Mic className="w-5 h-5" />
          Start Recording
        </button>
      )}

      {isRecording && (
        <div className="flex gap-2">
          {!isPaused ? (
            <button
              onClick={pauseRecording}
              className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
            >
              <Pause className="w-5 h-5" />
              Pause
            </button>
          ) : (
            <button
              onClick={resumeRecording}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Resume
            </button>
          )}

          <button
            onClick={stopRecording}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Square className="w-5 h-5" />
            Stop
          </button>
        </div>
      )}

      {audioBlob && audioURL && !isRecording && (
        <div className="space-y-3">
          <audio src={audioURL} controls className="w-full" />

          <div className="flex gap-2">
            <button
              onClick={transcribeAndUpload}
              disabled={isTranscribing}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              {isTranscribing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload & Transcribe
                </>
              )}
            </button>

            <button
              onClick={deleteRecording}
              className="px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-600 text-center">
            Audio will be transcribed and added to your chat. If it's a lecture, it will be saved
            to your schedule.
          </p>
        </div>
      )}
    </div>
  );
}
