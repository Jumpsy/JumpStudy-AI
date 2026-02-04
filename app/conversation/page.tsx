'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Loader2, Settings, X } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ConversationPage() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState('')

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Initialize speech synthesis and get available voices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis

      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || []
        // Prefer English voices
        const englishVoices = voices.filter(v => v.lang.startsWith('en'))
        setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices)

        // Select a good default voice
        const preferred = englishVoices.find(v =>
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Alex')
        ) || englishVoices[0] || voices[0]

        if (preferred) setSelectedVoice(preferred)
      }

      loadVoices()
      synthRef.current?.addEventListener('voiceschanged', loadVoices)

      return () => {
        synthRef.current?.removeEventListener('voiceschanged', loadVoices)
      }
    }
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          setTranscript(interimTranscript || finalTranscript)

          if (finalTranscript) {
            handleUserInput(finalTranscript)
            setTranscript('')
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          if (event.error !== 'no-speech') {
            setError(`Microphone error: ${event.error}`)
          }
          setIsListening(false)
        }

        recognition.onend = () => {
          if (isListening) {
            try {
              recognition.start()
            } catch (e) {
              setIsListening(false)
            }
          }
        }

        recognitionRef.current = recognition
      } else {
        setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      }
    }
  }, [isListening])

  // Handle user voice input
  const handleUserInput = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsProcessing(true)

    try {
      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])

      // Speak the response if voice is enabled
      if (voiceEnabled && synthRef.current) {
        speakText(data.message)
      }

    } catch (error) {
      console.error('Chat error:', error)
      setError('Failed to get response. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [messages, isProcessing, voiceEnabled])

  // Text-to-speech function
  const speakText = (text: string) => {
    if (!synthRef.current) return

    // Cancel any ongoing speech
    synthRef.current.cancel()

    // Clean text for speech (remove markdown, etc.)
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.voice = selectedVoice
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setError('')
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {
        setError('Could not start microphone. Please check permissions.')
      }
    }
  }

  // Stop speaking
  const stopSpeaking = () => {
    synthRef.current?.cancel()
    setIsSpeaking(false)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4 relative">
              <Mic className="w-10 h-10 text-white" />
              {isListening && (
                <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Conversation Mode</h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Talk naturally with AI using your voice. Just click the microphone and start speaking.
              <span className="text-green-400 font-medium"> 100% Free & Unlimited</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
              {error}
              <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          {/* Main Conversation Area */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg mb-2">Ready to chat!</p>
                  <p className="text-sm">Click the microphone below and start talking</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Current transcript */}
              {transcript && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-green-600/50 text-white/70 italic">
                    {transcript}...
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-gray-400">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="border-t border-gray-800 p-6">
              <div className="flex items-center justify-center gap-4">
                {/* Settings button */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
                >
                  <Settings className="w-6 h-6" />
                </button>

                {/* Main mic button */}
                <button
                  onClick={toggleListening}
                  disabled={isProcessing}
                  className={`relative p-6 rounded-full transition-all transform hover:scale-105 ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                      : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isListening ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                  {isListening && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-400/50 animate-ping" />
                  )}
                </button>

                {/* Voice toggle */}
                <button
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking()
                    } else {
                      setVoiceEnabled(!voiceEnabled)
                    }
                  }}
                  className={`p-3 rounded-full transition-colors ${
                    isSpeaking
                      ? 'bg-purple-500 text-white animate-pulse'
                      : voiceEnabled
                      ? 'bg-gray-800 hover:bg-gray-700 text-green-400'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-500'
                  }`}
                >
                  {voiceEnabled || isSpeaking ? (
                    <Volume2 className="w-6 h-6" />
                  ) : (
                    <VolumeX className="w-6 h-6" />
                  )}
                </button>
              </div>

              {/* Status text */}
              <p className="text-center text-sm text-gray-500 mt-4">
                {isListening
                  ? 'Listening... Speak now'
                  : isProcessing
                  ? 'Processing your message...'
                  : isSpeaking
                  ? 'Speaking... Click speaker to stop'
                  : 'Click the microphone to start talking'}
              </p>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Voice Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded hover:bg-gray-800 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">AI Voice</label>
                  <select
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                      const voice = availableVoices.find(v => v.name === e.target.value)
                      if (voice) setSelectedVoice(voice)
                    }}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Voice responses</span>
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      voiceEnabled ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        voiceEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">How it works</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>1. Click the microphone button to start listening</li>
              <li>2. Speak naturally - the AI will hear and respond</li>
              <li>3. Enable voice responses to hear the AI talk back</li>
              <li>4. Uses your browser's built-in speech features - 100% free!</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
