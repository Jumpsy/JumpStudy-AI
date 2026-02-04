import { NextRequest, NextResponse } from 'next/server'
import { calculateAIProbability, analyzeTextPatterns } from '@/lib/utils'

// Advanced AI detection with multiple analysis layers
function performAdvancedDetection(text: string) {
  const basicAnalysis = calculateAIProbability(text)
  const patterns = analyzeTextPatterns(text)

  // Additional detection layers
  const additionalAnalysis = {
    // Check for perfect grammar (AI tends to be too perfect)
    grammarPerfection: checkGrammarPerfection(text),
    // Check for emotional depth
    emotionalDepth: checkEmotionalDepth(text),
    // Check for personal anecdotes
    personalElements: checkPersonalElements(text),
    // Check for hedging language
    hedgingLanguage: checkHedgingLanguage(text),
    // Check for specificity
    specificityScore: checkSpecificity(text),
  }

  // Weighted final score
  const weights = {
    basic: 0.4,
    grammar: 0.15,
    emotional: 0.15,
    personal: 0.15,
    hedging: 0.1,
    specificity: 0.05,
  }

  const finalScore = Math.round(
    basicAnalysis.score * weights.basic +
    additionalAnalysis.grammarPerfection * weights.grammar +
    (100 - additionalAnalysis.emotionalDepth) * weights.emotional +
    (100 - additionalAnalysis.personalElements) * weights.personal +
    additionalAnalysis.hedgingLanguage * weights.hedging +
    (100 - additionalAnalysis.specificityScore) * weights.specificity
  )

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    confidence: patterns.totalWords < 50 ? 'Low' : patterns.totalWords < 150 ? 'Medium' : 'High',
    verdict: getVerdict(finalScore),
    breakdown: {
      patternAnalysis: basicAnalysis.analysis,
      grammarPerfection: additionalAnalysis.grammarPerfection,
      emotionalDepth: additionalAnalysis.emotionalDepth,
      personalElements: additionalAnalysis.personalElements,
      hedgingLanguage: additionalAnalysis.hedgingLanguage,
      specificity: additionalAnalysis.specificityScore,
    },
    stats: {
      wordCount: patterns.totalWords,
      sentenceCount: patterns.totalSentences,
      avgSentenceLength: Math.round(patterns.avgSentenceLength * 10) / 10,
      avgWordLength: Math.round(patterns.avgWordLength * 10) / 10,
    },
    highlights: identifyAIPatterns(text),
  }
}

function checkGrammarPerfection(text: string): number {
  // AI text tends to have perfect grammar
  let score = 50

  // Check for contractions (human text uses more)
  const contractions = text.match(/\b(don't|can't|won't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|wouldn't|couldn't|shouldn't|it's|that's|there's|here's|what's|who's|let's|I'm|you're|we're|they're|I've|you've|we've|they've|I'll|you'll|we'll|they'll|I'd|you'd|we'd|they'd)\b/gi)
  if (!contractions || contractions.length < text.split(/\s+/).length / 50) {
    score += 20
  }

  // Check for sentence fragments (humans use these naturally)
  const sentences = text.split(/[.!?]+/)
  const shortSentences = sentences.filter(s => s.trim().split(/\s+/).length <= 3)
  if (shortSentences.length < sentences.length * 0.1) {
    score += 15
  }

  // Check for informal language
  const informalWords = text.match(/\b(yeah|yep|nope|gonna|wanna|kinda|sorta|stuff|things|cool|awesome|basically|literally|actually|pretty much)\b/gi)
  if (!informalWords || informalWords.length === 0) {
    score += 15
  }

  return Math.min(100, score)
}

function checkEmotionalDepth(text: string): number {
  let score = 0

  // Emotional words and expressions
  const emotionalPatterns = [
    /\b(love|hate|fear|joy|sad|happy|angry|frustrated|excited|worried|anxious|thrilled|devastated|ecstatic)\b/gi,
    /\b(honestly|frankly|truthfully|personally|sincerely)\b/gi,
    /!{2,}/g,
    /\?{2,}/g,
    /\b(omg|wow|oh no|yay|ugh|argh|hmm|ahh)\b/gi,
  ]

  for (const pattern of emotionalPatterns) {
    const matches = text.match(pattern)
    if (matches) score += matches.length * 10
  }

  return Math.min(100, score)
}

function checkPersonalElements(text: string): number {
  let score = 0

  // Personal pronouns in storytelling context
  const personalPatterns = [
    /\b(I remember|I once|I used to|I've always|I personally|in my experience|from my perspective|I believe|I think|I feel)\b/gi,
    /\b(my friend|my family|my mom|my dad|my brother|my sister|my colleague|my boss)\b/gi,
    /\b(last year|last week|yesterday|the other day|a few years ago|when I was)\b/gi,
  ]

  for (const pattern of personalPatterns) {
    const matches = text.match(pattern)
    if (matches) score += matches.length * 15
  }

  return Math.min(100, score)
}

function checkHedgingLanguage(text: string): number {
  let score = 0

  // Hedging patterns common in AI text
  const hedgingPatterns = [
    /\b(it is important to|it should be noted|it is worth mentioning|one might argue|it could be said)\b/gi,
    /\b(generally speaking|broadly speaking|in general|for the most part|by and large)\b/gi,
    /\b(may|might|could|would|should|perhaps|possibly|potentially|arguably)\b/gi,
  ]

  for (const pattern of hedgingPatterns) {
    const matches = text.match(pattern)
    if (matches) score += matches.length * 8
  }

  return Math.min(100, score)
}

function checkSpecificity(text: string): number {
  let score = 0

  // Specific details that suggest human writing
  const specificPatterns = [
    /\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi, // Times
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi, // Dates
    /\b\$\d+(\.\d{2})?\b/g, // Prices
    /\b\d+\s*(miles|kilometers|meters|feet|inches|pounds|kilograms|gallons|liters)\b/gi, // Measurements
    /"[^"]{10,}"/g, // Direct quotes
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // Proper names
  ]

  for (const pattern of specificPatterns) {
    const matches = text.match(pattern)
    if (matches) score += matches.length * 12
  }

  return Math.min(100, score)
}

function getVerdict(score: number): { label: string; description: string; color: string } {
  if (score >= 80) {
    return {
      label: 'Very Likely AI',
      description: 'This text shows strong patterns typically associated with AI-generated content.',
      color: 'red',
    }
  } else if (score >= 60) {
    return {
      label: 'Probably AI',
      description: 'This text contains several patterns that suggest AI involvement.',
      color: 'orange',
    }
  } else if (score >= 40) {
    return {
      label: 'Possibly AI',
      description: 'This text has some AI-like patterns but also human elements.',
      color: 'yellow',
    }
  } else if (score >= 20) {
    return {
      label: 'Probably Human',
      description: 'This text appears mostly human-written with few AI patterns.',
      color: 'lightgreen',
    }
  } else {
    return {
      label: 'Very Likely Human',
      description: 'This text shows natural human writing patterns.',
      color: 'green',
    }
  }
}

function identifyAIPatterns(text: string): { text: string; reason: string }[] {
  const highlights: { text: string; reason: string }[] = []

  const patterns: { regex: RegExp; reason: string }[] = [
    { regex: /\bfurthermore\b/gi, reason: 'Formal transition word' },
    { regex: /\bmoreover\b/gi, reason: 'Formal transition word' },
    { regex: /\bnevertheless\b/gi, reason: 'Formal transition word' },
    { regex: /\bnotwithstanding\b/gi, reason: 'Overly formal word' },
    { regex: /\bdelve\b/gi, reason: 'AI-favored vocabulary' },
    { regex: /\bleverage\b/gi, reason: 'AI-favored vocabulary' },
    { regex: /\butilize\b/gi, reason: 'Unnecessarily formal word' },
    { regex: /\bin conclusion\b/gi, reason: 'Generic conclusion phrase' },
    { regex: /\bit is important to note\b/gi, reason: 'AI hedging phrase' },
    { regex: /\bit's worth noting\b/gi, reason: 'AI hedging phrase' },
    { regex: /\bin today's world\b/gi, reason: 'Generic AI phrase' },
    { regex: /\bin this day and age\b/gi, reason: 'Cliched AI phrase' },
    { regex: /\bfacilitate\b/gi, reason: 'Unnecessarily formal word' },
    { regex: /\bimplement\b/gi, reason: 'Technical jargon' },
    { regex: /\boptimize\b/gi, reason: 'Technical jargon' },
  ]

  for (const { regex, reason } of patterns) {
    const matches = text.match(regex)
    if (matches) {
      for (const match of matches) {
        if (!highlights.find(h => h.text.toLowerCase() === match.toLowerCase())) {
          highlights.push({ text: match, reason })
        }
      }
    }
  }

  return highlights.slice(0, 10) // Limit to 10 highlights
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Text must be at least 20 characters for accurate detection' },
        { status: 400 }
      )
    }

    // Perform multi-layer AI detection
    const result = performAdvancedDetection(text)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Detection API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze text' },
      { status: 500 }
    )
  }
}
