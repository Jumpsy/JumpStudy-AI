'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Video, Loader2, Download, Play, Pause, RefreshCw, Sparkles } from 'lucide-react'

export default function VideoGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(3)
  const [style, setStyle] = useState('cinematic')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    frames: string[]
    preview: string
    frameCount: number
  } | null>(null)
  const [error, setError] = useState('')
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const STYLES = [
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'anime', label: 'Anime' },
    { id: 'realistic', label: 'Realistic' },
    { id: '3d-animation', label: '3D Animation' },
    { id: 'cartoon', label: 'Cartoon' },
    { id: 'sci-fi', label: 'Sci-Fi' },
  ]

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setError('')
    setResult(null)
    setCurrentFrame(0)
    setIsPlaying(false)

    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration, style }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResult({
        frames: data.frames,
        preview: data.preview,
        frameCount: data.frameCount,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to generate video')
    } finally {
      setIsLoading(false)
    }
  }

  // Animation playback
  useEffect(() => {
    if (!isPlaying || !result?.frames.length) return

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % result.frames.length)
    }, 500) // 2 FPS for smooth animation

    return () => clearInterval(interval)
  }, [isPlaying, result?.frames.length])

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const downloadFrames = () => {
    if (!result?.frames.length) return

    result.frames.forEach((frame, index) => {
      const a = document.createElement('a')
      a.href = frame
      a.download = `frame-${index + 1}.png`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    })
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">AI Video Generator</h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Create animated sequences from text descriptions. AI-powered motion graphics.
              <span className="text-green-400 font-medium"> 100% Free & Unlimited</span>
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe your video
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A rocket launching into space with colorful exhaust flames, stars in the background..."
                  className="w-full h-32 p-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Animation Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STYLES.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setStyle(id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        style === id
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration: {duration} seconds ({duration * 2} frames)
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1s</span>
                  <span>2s</span>
                  <span>3s</span>
                  <span>4s</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Frames...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Video
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
                  {error}
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="space-y-4">
              <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 relative">
                {result ? (
                  <>
                    <img
                      src={result.frames[currentFrame] || result.preview}
                      alt={`Frame ${currentFrame + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-3 p-3 bg-black/70 backdrop-blur rounded-xl">
                        <button
                          onClick={togglePlayback}
                          className="p-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5 text-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex gap-1">
                            {result.frames.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setCurrentFrame(idx)
                                  setIsPlaying(false)
                                }}
                                className={`flex-1 h-2 rounded-full transition-colors ${
                                  idx === currentFrame ? 'bg-violet-500' : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-300">
                          {currentFrame + 1}/{result.frameCount}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                    <Video className="w-16 h-16 mb-4 opacity-30" />
                    <p>Video preview will appear here</p>
                  </div>
                )}
              </div>

              {result && (
                <div className="flex gap-3">
                  <button
                    onClick={downloadFrames}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Frames
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-xl text-violet-400 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Frame Grid */}
          {result && result.frames.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">All Frames</h3>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {result.frames.map((frame, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentFrame(idx)
                      setIsPlaying(false)
                    }}
                    className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentFrame
                        ? 'border-violet-500 ring-2 ring-violet-500/30'
                        : 'border-transparent hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={frame}
                      alt={`Frame ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-8 p-6 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">About Video Generation</h3>
            <p className="text-gray-400 text-sm">
              Our AI generates a sequence of images that can be played as an animation. Each frame is
              uniquely generated to create motion effects. Download all frames to create GIFs or videos
              using your preferred editing software. The animation preview plays at 2 FPS for smooth
              viewing.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
