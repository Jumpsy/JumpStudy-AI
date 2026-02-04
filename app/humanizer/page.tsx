'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Sparkles, Loader2, Copy, Check, RotateCcw, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

interface HumanizeResult {
  original: string
  humanized: string
  humanScore: number
  changes: {
    contractionsAdded: number
    formalWordsRemoved: number
    naturalPhrasesAdded: number
  }
  wordCount: number
  mode: string
}

export default function HumanizerPage() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'light' | 'medium' | 'aggressive'>('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<HumanizeResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleHumanize = async () => {
    if (!text.trim() || isLoading) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResult(data)
    } catch (error) {
      console.error('Humanization failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.humanized)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setText('')
    setResult(null)
  }

  const handleUseResult = () => {
    if (result) {
      setText(result.humanized)
      setResult(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">AI Text Humanizer</h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Transform AI-generated text into natural human writing that bypasses AI detectors.
              <span className="text-green-400 font-medium"> 100% Free & Unlimited</span>
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1 bg-gray-900 rounded-xl">
              {[
                { value: 'light', label: 'Light', desc: 'Subtle changes' },
                { value: 'medium', label: 'Medium', desc: 'Balanced' },
                { value: 'aggressive', label: 'Aggressive', desc: 'Maximum changes' },
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setMode(value as typeof mode)}
                  className={`px-6 py-3 rounded-lg transition-all ${
                    mode === value
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-xs opacity-70">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">Original Text (AI-generated)</h3>
                <span className="text-sm text-gray-500">
                  {text.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your AI-generated text here..."
                className="w-full h-72 p-4 bg-gray-900 border border-gray-800 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleHumanize}
                  disabled={!text.trim() || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Humanizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Humanize Text
                    </>
                  )}
                </button>
                {(text || result) && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Output Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">Humanized Text</h3>
                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>

              {result ? (
                <div className="relative">
                  <div className="w-full h-72 p-4 bg-gray-900 border border-green-500/30 rounded-2xl text-white overflow-y-auto">
                    {result.humanized}
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
                      {result.humanScore}% Human
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-72 p-4 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Humanized text will appear here</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="flex gap-3">
                  <button
                    onClick={handleUseResult}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Humanize Again
                  </button>
                  <Link
                    href="/detector"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-400 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Test with Detector
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Results Stats */}
          {result && (
            <div className="mt-8 p-6 bg-gray-900 border border-gray-800 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Transformation Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-2xl font-bold text-green-400">{result.humanScore}%</p>
                  <p className="text-sm text-gray-400">Human Score</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-400">{result.wordCount}</p>
                  <p className="text-sm text-gray-400">Words</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-400">+{result.changes.contractionsAdded}</p>
                  <p className="text-sm text-gray-400">Contractions Added</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-2xl font-bold text-orange-400">-{result.changes.formalWordsRemoved}</p>
                  <p className="text-sm text-gray-400">Formal Words Removed</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-2xl font-bold text-pink-400">+{result.changes.naturalPhrasesAdded}</p>
                  <p className="text-sm text-gray-400">Natural Phrases</p>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Tips for Best Results</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Use Medium Mode',
                  description: 'For most content, medium mode provides the best balance of changes without altering meaning.',
                },
                {
                  title: 'Run Multiple Times',
                  description: 'For heavily AI text, run the humanizer 2-3 times for maximum effectiveness.',
                },
                {
                  title: 'Test Your Results',
                  description: 'Use our AI Detector to verify your humanized text passes detection.',
                },
              ].map(({ title, description }) => (
                <div key={title} className="p-4 bg-gray-900/50 rounded-xl">
                  <h4 className="font-medium text-purple-300 mb-1">{title}</h4>
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
