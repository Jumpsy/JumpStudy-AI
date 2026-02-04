'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Image as ImageIcon, Loader2, Download, RefreshCw, Wand2, Sparkles } from 'lucide-react'

const STYLES = [
  { id: 'none', label: 'Default', description: 'No specific style' },
  { id: 'realistic', label: 'Realistic', description: 'Photo-realistic images' },
  { id: 'anime', label: 'Anime', description: 'Japanese anime style' },
  { id: 'digital-art', label: 'Digital Art', description: 'Modern digital artwork' },
  { id: '3d-render', label: '3D Render', description: 'CGI 3D graphics' },
  { id: 'oil-painting', label: 'Oil Painting', description: 'Classical art style' },
  { id: 'watercolor', label: 'Watercolor', description: 'Soft watercolor style' },
  { id: 'pixel-art', label: 'Pixel Art', description: 'Retro 8-bit style' },
  { id: 'cyberpunk', label: 'Cyberpunk', description: 'Futuristic neon style' },
  { id: 'fantasy', label: 'Fantasy', description: 'Magical fantasy style' },
]

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('none')
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setError('')
    setImages([])

    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: style !== 'none' ? style : undefined,
          count: 2,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setImages(data.images)
    } catch (err: any) {
      setError(err.message || 'Failed to generate image')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jumpstudy-ai-image-${index + 1}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      // Fallback: open in new tab
      window.open(imageUrl, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 mb-4">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">AI Image Generator</h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Create stunning images from text descriptions. Powered by AI.
              <span className="text-green-400 font-medium"> 100% Free & Unlimited</span>
            </p>
          </div>

          {/* Input Section */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe your image
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A majestic dragon flying over a medieval castle at sunset, highly detailed, cinematic lighting..."
                  className="w-full h-32 p-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Art Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {STYLES.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setStyle(id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        style === id
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Images
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Results */}
          {images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white text-center">Generated Images</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
                      <img
                        src={imageUrl}
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-4">
                      <button
                        onClick={() => handleDownload(imageUrl, index)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={() => window.open(imageUrl, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        View Full
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Generate More
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && images.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-12 h-12 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">No images generated yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Describe what you want to create and click "Generate Images" to get started.
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="mt-12 p-6 bg-gray-900/50 border border-gray-800 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Tips for Better Results</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Be Specific',
                  description: 'Include details like lighting, colors, mood, and composition.',
                },
                {
                  title: 'Use Art Styles',
                  description: 'Select an art style to give your image a consistent look.',
                },
                {
                  title: 'Add Context',
                  description: 'Describe the environment, time of day, and atmosphere.',
                },
              ].map(({ title, description }) => (
                <div key={title} className="p-4 bg-gray-800/50 rounded-xl">
                  <h4 className="font-medium text-pink-300 mb-1">{title}</h4>
                  <p className="text-sm text-gray-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
