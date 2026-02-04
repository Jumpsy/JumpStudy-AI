'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Shield, Loader2, AlertTriangle, CheckCircle, Copy, Check, RotateCcw, Zap } from 'lucide-react'

interface DetectionResult {
  score: number
  confidence: string
  verdict: {
    label: string
    description: string
    color: string
  }
  breakdown: {
    patternAnalysis: {
      patterns: number
      burstiness: number
      vocabulary: number
      structure: number
    }
    grammarPerfection: number
    emotionalDepth: number
    personalElements: number
    hedgingLanguage: number
    specificity: number
  }
  stats: {
    wordCount: number
    sentenceCount: number
    avgSentenceLength: number
    avgWordLength: number
  }
  highlights: { text: string; reason: string }[]
}

export default function DetectorPage() {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleDetect = async () => {
    if (!text.trim() || isLoading) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResult(data)
    } catch (error) {
      console.error('Detection failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(
      `AI Detection Score: ${result.score}%\nVerdict: ${result.verdict.label}\nConfidence: ${result.confidence}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setText('')
    setResult(null)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400'
    if (score >= 60) return 'text-orange-400'
    if (score >= 40) return 'text-yellow-400'
    if (score >= 20) return 'text-green-400'
    return 'text-emerald-400'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-red-500 to-red-600'
    if (score >= 60) return 'from-orange-500 to-orange-600'
    if (score >= 40) return 'from-yellow-500 to-yellow-600'
    if (score >= 20) return 'from-green-500 to-green-600'
    return 'from-emerald-500 to-emerald-600'
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">AI Content Detector</h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Instantly detect if text was written by AI. Multi-layer analysis with detailed breakdown.
              <span className="text-green-400 font-medium"> 100% Free & Unlimited</span>
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your text here to check if it was written by AI..."
                  className="w-full h-80 p-4 bg-gray-900 border border-gray-800 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-500">
                  {text.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDetect}
                  disabled={!text.trim() || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Detect AI Content
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

            {/* Results Section */}
            <div className="space-y-4">
              {result ? (
                <>
                  {/* Main Score */}
                  <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Detection Result</h3>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex items-center gap-6 mb-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#1f2937"
                            strokeWidth="10"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#scoreGradient)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${result.score * 2.83} 283`}
                            className="score-fill"
                          />
                          <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor={result.score >= 50 ? '#ef4444' : '#22c55e'} />
                              <stop offset="100%" stopColor={result.score >= 50 ? '#f97316' : '#10b981'} />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                            {result.score}%
                          </span>
                          <span className="text-xs text-gray-500">AI Probability</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-2 ${
                          result.score >= 60
                            ? 'bg-red-500/20 text-red-400'
                            : result.score >= 40
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {result.score >= 60 ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          {result.verdict.label}
                        </div>
                        <p className="text-sm text-gray-400">{result.verdict.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Confidence: <span className="text-gray-300">{result.confidence}</span>
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-800">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{result.stats.wordCount}</p>
                        <p className="text-xs text-gray-500">Words</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{result.stats.sentenceCount}</p>
                        <p className="text-xs text-gray-500">Sentences</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{result.stats.avgSentenceLength}</p>
                        <p className="text-xs text-gray-500">Avg Words/Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{result.stats.avgWordLength}</p>
                        <p className="text-xs text-gray-500">Avg Word Len</p>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
                    <h3 className="text-lg font-semibold text-white mb-4">Analysis Breakdown</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'AI Patterns', value: result.breakdown.patternAnalysis.patterns },
                        { label: 'Writing Uniformity', value: result.breakdown.patternAnalysis.burstiness },
                        { label: 'Vocabulary Complexity', value: result.breakdown.patternAnalysis.vocabulary },
                        { label: 'Grammar Perfection', value: result.breakdown.grammarPerfection },
                        { label: 'Hedging Language', value: result.breakdown.hedgingLanguage },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">{label}</span>
                            <span className={getScoreColor(value)}>{value}%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${getScoreGradient(value)} score-fill`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Patterns Found */}
                  {result.highlights.length > 0 && (
                    <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
                      <h3 className="text-lg font-semibold text-white mb-4">AI Patterns Detected</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.highlights.map(({ text, reason }, idx) => (
                          <div
                            key={idx}
                            className="group relative px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
                          >
                            "{text}"
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-900 border border-gray-800 rounded-2xl text-center">
                  <Shield className="w-16 h-16 text-gray-700 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No Analysis Yet</h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Paste text on the left and click "Detect AI Content" to analyze if it was written by AI.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
