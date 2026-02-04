import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Free AI API endpoints - these are public wrappers that don't require API keys
export const FREE_AI_APIS = {
  // Multiple free ChatGPT wrapper endpoints
  chat: [
    'https://api.pawan.krd/v1/chat/completions',
    'https://api.freegpt4.ddns.net/v1/chat/completions',
    'https://free.churchless.tech/v1/chat/completions',
    'https://ai.fakeopen.com/v1/chat/completions',
  ],
  // Free AI detection APIs
  detect: [
    'https://api.zerogpt.com/api/detect/detectText',
    'https://api.gptzero.me/v2/predict/text',
  ],
}

// Rotate through APIs for load balancing
let chatApiIndex = 0
export function getNextChatApi(): string {
  const api = FREE_AI_APIS.chat[chatApiIndex]
  chatApiIndex = (chatApiIndex + 1) % FREE_AI_APIS.chat.length
  return api
}

// Text analysis utilities for AI detection
export function analyzeTextPatterns(text: string) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = text.split(/\s+/).filter(w => w.length > 0)

  // Calculate various metrics
  const avgSentenceLength = words.length / Math.max(sentences.length, 1)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1)

  // Detect repetitive patterns (common in AI text)
  const phrases = new Map<string, number>()
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(' ').toLowerCase()
    phrases.set(phrase, (phrases.get(phrase) || 0) + 1)
  }
  const repetitivePatterns = Array.from(phrases.values()).filter(count => count > 1).length

  // Check for common AI patterns
  const aiPatterns = [
    /\bfurthermore\b/gi,
    /\bmoreover\b/gi,
    /\bin conclusion\b/gi,
    /\bit is important to note\b/gi,
    /\bit's worth noting\b/gi,
    /\badditionally\b/gi,
    /\bconsequently\b/gi,
    /\bhowever,\s/gi,
    /\btherefore,\s/gi,
    /\bnevertheless\b/gi,
    /\bnotwithstanding\b/gi,
    /\bdelve\b/gi,
    /\bleverage\b/gi,
    /\bfacilitate\b/gi,
    /\bimplement\b/gi,
    /\butilize\b/gi,
    /\boptimize\b/gi,
    /\bin today's world\b/gi,
    /\bin this day and age\b/gi,
    /\bas we all know\b/gi,
  ]

  let aiPatternCount = 0
  for (const pattern of aiPatterns) {
    const matches = text.match(pattern)
    if (matches) aiPatternCount += matches.length
  }

  // Check sentence variety
  const sentenceStarters = sentences.map(s => s.trim().split(' ')[0]?.toLowerCase())
  const uniqueStarters = new Set(sentenceStarters).size
  const starterVariety = uniqueStarters / Math.max(sentences.length, 1)

  // Calculate burstiness (variance in sentence length)
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length)
  const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(sentenceLengths.length, 1)
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLen, 2), 0) / Math.max(sentenceLengths.length, 1)
  const burstiness = Math.sqrt(variance)

  return {
    avgSentenceLength,
    avgWordLength,
    repetitivePatterns,
    aiPatternCount,
    starterVariety,
    burstiness,
    totalWords: words.length,
    totalSentences: sentences.length,
  }
}

// Calculate AI probability based on text analysis
export function calculateAIProbability(text: string): {
  score: number
  confidence: string
  analysis: {
    patterns: number
    burstiness: number
    vocabulary: number
    structure: number
  }
} {
  const analysis = analyzeTextPatterns(text)

  // Score each factor (0-100)
  let patternScore = Math.min(100, analysis.aiPatternCount * 15)
  let burstyScore = analysis.burstiness < 5 ? 70 : analysis.burstiness < 10 ? 40 : 20
  let vocabScore = analysis.avgWordLength > 5.5 ? 60 : analysis.avgWordLength > 4.5 ? 40 : 25
  let structureScore = analysis.starterVariety < 0.5 ? 70 : analysis.starterVariety < 0.7 ? 40 : 20

  // Repetitive patterns increase AI likelihood
  if (analysis.repetitivePatterns > 3) {
    patternScore += 20
  }

  // Very uniform sentence lengths are suspicious
  if (analysis.burstiness < 3 && analysis.totalSentences > 3) {
    burstyScore += 25
  }

  // Calculate weighted average
  const weights = { patterns: 0.35, burstiness: 0.25, vocabulary: 0.2, structure: 0.2 }
  const score = Math.round(
    patternScore * weights.patterns +
    burstyScore * weights.burstiness +
    vocabScore * weights.vocabulary +
    structureScore * weights.structure
  )

  // Determine confidence level
  let confidence = 'Medium'
  if (analysis.totalWords < 50) confidence = 'Low'
  else if (analysis.totalWords > 200 && Math.abs(score - 50) > 25) confidence = 'High'

  return {
    score: Math.min(100, Math.max(0, score)),
    confidence,
    analysis: {
      patterns: Math.min(100, patternScore),
      burstiness: Math.min(100, burstyScore),
      vocabulary: Math.min(100, vocabScore),
      structure: Math.min(100, structureScore),
    },
  }
}

// Humanize text by adding natural variations
export function humanizeText(text: string): string {
  let result = text

  // Replace formal words with casual alternatives
  const replacements: [RegExp, string[]][] = [
    [/\bfurthermore\b/gi, ['also', 'plus', 'and']],
    [/\bmoreover\b/gi, ['also', 'besides', 'and']],
    [/\bnevertheless\b/gi, ['still', 'but', 'yet']],
    [/\bconsequently\b/gi, ['so', 'because of this', 'as a result']],
    [/\btherefore\b/gi, ['so', 'that\'s why', 'because of that']],
    [/\bhowever\b/gi, ['but', 'though', 'still']],
    [/\badditionally\b/gi, ['also', 'plus', 'on top of that']],
    [/\bnotwithstanding\b/gi, ['despite this', 'even so', 'still']],
    [/\butilize\b/gi, ['use', 'work with', 'apply']],
    [/\bfacilitate\b/gi, ['help', 'make easier', 'support']],
    [/\bimplement\b/gi, ['use', 'apply', 'put in place']],
    [/\bleverage\b/gi, ['use', 'take advantage of', 'build on']],
    [/\boptimize\b/gi, ['improve', 'make better', 'enhance']],
    [/\bdelve\b/gi, ['look into', 'explore', 'dig into']],
    [/\bin conclusion\b/gi, ['to wrap up', 'in the end', 'finally']],
    [/\bit is important to note\b/gi, ['keep in mind', 'remember', 'note that']],
    [/\bit's worth noting\b/gi, ['interestingly', 'one thing to know', 'by the way']],
    [/\bin today's world\b/gi, ['nowadays', 'these days', 'right now']],
    [/\bin this day and age\b/gi, ['today', 'now', 'currently']],
  ]

  for (const [pattern, alternatives] of replacements) {
    result = result.replace(pattern, () => {
      return alternatives[Math.floor(Math.random() * alternatives.length)]
    })
  }

  // Add slight variations to sentence structure
  const sentences = result.split(/([.!?]+)/)
  const processedSentences: string[] = []

  for (let i = 0; i < sentences.length; i += 2) {
    let sentence = sentences[i]
    const punctuation = sentences[i + 1] || ''

    if (sentence.trim().length > 0) {
      // Randomly add filler words (natural speech patterns)
      if (Math.random() < 0.15) {
        const fillers = ['Actually, ', 'Honestly, ', 'You know, ', 'I think ', 'Really, ']
        sentence = fillers[Math.floor(Math.random() * fillers.length)] + sentence.trim().charAt(0).toLowerCase() + sentence.trim().slice(1)
      }

      // Sometimes add contractions
      sentence = sentence
        .replace(/\bdo not\b/gi, Math.random() < 0.7 ? "don't" : 'do not')
        .replace(/\bcannot\b/gi, Math.random() < 0.7 ? "can't" : 'cannot')
        .replace(/\bwill not\b/gi, Math.random() < 0.7 ? "won't" : 'will not')
        .replace(/\bshould not\b/gi, Math.random() < 0.7 ? "shouldn't" : 'should not')
        .replace(/\bwould not\b/gi, Math.random() < 0.7 ? "wouldn't" : 'would not')
        .replace(/\bcould not\b/gi, Math.random() < 0.7 ? "couldn't" : 'could not')
        .replace(/\bit is\b/gi, Math.random() < 0.5 ? "it's" : 'it is')
        .replace(/\bthat is\b/gi, Math.random() < 0.5 ? "that's" : 'that is')
        .replace(/\bI am\b/gi, Math.random() < 0.6 ? "I'm" : 'I am')
        .replace(/\bthey are\b/gi, Math.random() < 0.5 ? "they're" : 'they are')
        .replace(/\bwe are\b/gi, Math.random() < 0.5 ? "we're" : 'we are')

      processedSentences.push(sentence + punctuation)
    }
  }

  result = processedSentences.join(' ')

  // Add occasional typo-like natural mistakes (subtle)
  if (Math.random() < 0.1 && result.length > 100) {
    const words = result.split(' ')
    const idx = Math.floor(Math.random() * words.length)
    // Add a common natural pause
    if (words[idx] && words[idx].length > 4) {
      words.splice(idx, 0, '--')
      result = words.join(' ').replace(' -- ', ' - ')
    }
  }

  return result.trim()
}
