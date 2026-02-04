import { NextRequest, NextResponse } from 'next/server'
import { humanizeText } from '@/lib/utils'

// Advanced humanization engine with multiple techniques
function advancedHumanize(text: string, mode: 'light' | 'medium' | 'aggressive' = 'medium'): string {
  let result = text

  // Step 1: Replace formal/AI vocabulary with natural alternatives
  const formalToNatural: [RegExp, () => string][] = [
    [/\bfurthermore\b/gi, () => ['also', 'plus', 'and', 'on top of that'][Math.floor(Math.random() * 4)]],
    [/\bmoreover\b/gi, () => ['also', 'besides', 'and', 'not only that'][Math.floor(Math.random() * 4)]],
    [/\bnevertheless\b/gi, () => ['still', 'but', 'yet', 'even so'][Math.floor(Math.random() * 4)]],
    [/\bconsequently\b/gi, () => ['so', 'because of this', 'that meant', 'which led to'][Math.floor(Math.random() * 4)]],
    [/\btherefore\b/gi, () => ['so', "that's why", 'which is why', 'because of that'][Math.floor(Math.random() * 4)]],
    [/\bhowever,?\s/gi, () => ['but ', 'though ', 'still, ', 'yet '][Math.floor(Math.random() * 4)]],
    [/\badditionally\b/gi, () => ['also', 'plus', 'on top of that', 'another thing'][Math.floor(Math.random() * 4)]],
    [/\bnotwithstanding\b/gi, () => ['despite this', 'even so', 'still', 'regardless'][Math.floor(Math.random() * 4)]],
    [/\butilize\b/gi, () => ['use', 'work with', 'go with', 'try'][Math.floor(Math.random() * 4)]],
    [/\bfacilitate\b/gi, () => ['help', 'make easier', 'support', 'assist with'][Math.floor(Math.random() * 4)]],
    [/\bimplement\b/gi, () => ['use', 'apply', 'put in place', 'set up'][Math.floor(Math.random() * 4)]],
    [/\bleverage\b/gi, () => ['use', 'take advantage of', 'build on', 'tap into'][Math.floor(Math.random() * 4)]],
    [/\boptimize\b/gi, () => ['improve', 'make better', 'tweak', 'fine-tune'][Math.floor(Math.random() * 4)]],
    [/\bdelve\b/gi, () => ['look into', 'explore', 'dig into', 'check out'][Math.floor(Math.random() * 4)]],
    [/\bcommence\b/gi, () => ['start', 'begin', 'kick off', 'get going'][Math.floor(Math.random() * 4)]],
    [/\bterminate\b/gi, () => ['end', 'stop', 'finish', 'wrap up'][Math.floor(Math.random() * 4)]],
    [/\bpurchase\b/gi, () => ['buy', 'get', 'pick up', 'grab'][Math.floor(Math.random() * 4)]],
    [/\binquire\b/gi, () => ['ask', 'check', 'find out', 'look into'][Math.floor(Math.random() * 4)]],
    [/\bassist\b/gi, () => ['help', 'give a hand', 'support', 'pitch in'][Math.floor(Math.random() * 4)]],
    [/\brequire\b/gi, () => ['need', 'want', 'have to have', 'must have'][Math.floor(Math.random() * 4)]],
    [/\bprovide\b/gi, () => ['give', 'offer', 'share', 'bring'][Math.floor(Math.random() * 4)]],
    [/\bobtain\b/gi, () => ['get', 'grab', 'pick up', 'find'][Math.floor(Math.random() * 4)]],
    [/\bdemonstrate\b/gi, () => ['show', 'prove', 'make clear', 'display'][Math.floor(Math.random() * 4)]],
    [/\bindicate\b/gi, () => ['show', 'point to', 'suggest', 'mean'][Math.floor(Math.random() * 4)]],
    [/\bsubsequently\b/gi, () => ['then', 'after that', 'later', 'next'][Math.floor(Math.random() * 4)]],
    [/\bprior to\b/gi, () => ['before', 'ahead of', 'earlier than'][Math.floor(Math.random() * 3)]],
    [/\bin order to\b/gi, () => ['to', 'so I can', 'for'][Math.floor(Math.random() * 3)]],
    [/\bdue to the fact that\b/gi, () => ['because', 'since', 'as'][Math.floor(Math.random() * 3)]],
    [/\bat this point in time\b/gi, () => ['now', 'right now', 'currently'][Math.floor(Math.random() * 3)]],
    [/\bin the event that\b/gi, () => ['if', 'when', 'should'][Math.floor(Math.random() * 3)]],
    [/\bfor the purpose of\b/gi, () => ['to', 'for', 'so that'][Math.floor(Math.random() * 3)]],
    [/\bin conclusion\b/gi, () => ['to wrap up', 'in the end', 'finally', 'all in all'][Math.floor(Math.random() * 4)]],
    [/\bit is important to note\b/gi, () => ['keep in mind', 'remember', 'note that', 'just know'][Math.floor(Math.random() * 4)]],
    [/\bit's worth noting\b/gi, () => ['interestingly', 'one thing', 'by the way', 'fun fact'][Math.floor(Math.random() * 4)]],
    [/\bin today's world\b/gi, () => ['nowadays', 'these days', 'right now', 'today'][Math.floor(Math.random() * 4)]],
    [/\bin this day and age\b/gi, () => ['today', 'now', 'currently', 'these days'][Math.floor(Math.random() * 4)]],
    [/\bas previously mentioned\b/gi, () => ['as I said', 'like I mentioned', 'as noted'][Math.floor(Math.random() * 3)]],
    [/\bit goes without saying\b/gi, () => ['obviously', 'of course', 'clearly'][Math.floor(Math.random() * 3)]],
    [/\bneedless to say\b/gi, () => ['obviously', 'of course', 'clearly'][Math.floor(Math.random() * 3)]],
    [/\ball things considered\b/gi, () => ['overall', 'in the end', 'when you think about it'][Math.floor(Math.random() * 3)]],
  ]

  for (const [pattern, replacement] of formalToNatural) {
    result = result.replace(pattern, replacement)
  }

  // Step 2: Add contractions naturally
  const contractionRules: [RegExp, string, number][] = [
    [/\bdo not\b/gi, "don't", 0.8],
    [/\bcannot\b/gi, "can't", 0.85],
    [/\bwill not\b/gi, "won't", 0.8],
    [/\bshould not\b/gi, "shouldn't", 0.75],
    [/\bwould not\b/gi, "wouldn't", 0.75],
    [/\bcould not\b/gi, "couldn't", 0.75],
    [/\bdoes not\b/gi, "doesn't", 0.8],
    [/\bdid not\b/gi, "didn't", 0.85],
    [/\bhave not\b/gi, "haven't", 0.7],
    [/\bhas not\b/gi, "hasn't", 0.7],
    [/\bhad not\b/gi, "hadn't", 0.7],
    [/\bwas not\b/gi, "wasn't", 0.75],
    [/\bwere not\b/gi, "weren't", 0.75],
    [/\bis not\b/gi, "isn't", 0.8],
    [/\bare not\b/gi, "aren't", 0.8],
    [/\bit is\b/gi, "it's", 0.6],
    [/\bthat is\b/gi, "that's", 0.6],
    [/\bwhat is\b/gi, "what's", 0.7],
    [/\bthere is\b/gi, "there's", 0.6],
    [/\bhere is\b/gi, "here's", 0.6],
    [/\bI am\b/g, "I'm", 0.85],
    [/\bI have\b/g, "I've", 0.6],
    [/\bI will\b/g, "I'll", 0.7],
    [/\bI would\b/g, "I'd", 0.6],
    [/\byou are\b/gi, "you're", 0.7],
    [/\bthey are\b/gi, "they're", 0.65],
    [/\bwe are\b/gi, "we're", 0.7],
    [/\blet us\b/gi, "let's", 0.85],
  ]

  const probability = mode === 'light' ? 0.5 : mode === 'aggressive' ? 0.95 : 0.75
  for (const [pattern, replacement, baseProb] of contractionRules) {
    result = result.replace(pattern, () => Math.random() < baseProb * probability ? replacement : pattern.source.replace(/\\b/g, '').replace(/\\/g, ''))
  }

  // Step 3: Add natural sentence starters and transitions
  const sentences = result.split(/([.!?]+\s*)/)
  const processedSentences: string[] = []

  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i]

    if (sentence.trim().length > 15 && !sentence.match(/^[.!?]/)) {
      // Occasionally add natural sentence starters (mode-dependent frequency)
      const starterChance = mode === 'light' ? 0.05 : mode === 'aggressive' ? 0.2 : 0.1

      if (Math.random() < starterChance && i > 0) {
        const starters = [
          'Honestly, ',
          'Actually, ',
          'You know, ',
          'I mean, ',
          'Look, ',
          'The thing is, ',
          'To be fair, ',
          'Truth be told, ',
          'Basically, ',
          'Really, ',
        ]
        const starter = starters[Math.floor(Math.random() * starters.length)]
        sentence = starter + sentence.trim().charAt(0).toLowerCase() + sentence.trim().slice(1)
      }

      // Occasionally add emphasis words
      if (Math.random() < 0.05 && mode !== 'light') {
        sentence = sentence.replace(/\b(very|really|quite)\b/gi, () => {
          const emphatics = ['super', 'pretty', 'really', 'so', 'incredibly']
          return emphatics[Math.floor(Math.random() * emphatics.length)]
        })
      }
    }

    processedSentences.push(sentence)
  }

  result = processedSentences.join('')

  // Step 4: Add slight imperfections (aggressive mode only)
  if (mode === 'aggressive') {
    // Occasionally add a dash for natural pauses
    if (Math.random() < 0.1) {
      const words = result.split(' ')
      if (words.length > 10) {
        const insertIdx = Math.floor(words.length / 3) + Math.floor(Math.random() * 5)
        words.splice(insertIdx, 0, '-')
        result = words.join(' ').replace(' - ', ' - ')
      }
    }

    // Add informal ending if appropriate
    if (Math.random() < 0.1 && !result.endsWith('?') && !result.endsWith('!')) {
      const endings = [', you know?', ', right?', '.', '!']
      result = result.trimEnd()
      if (result.endsWith('.')) {
        result = result.slice(0, -1) + endings[Math.floor(Math.random() * endings.length)]
      }
    }
  }

  // Step 5: Vary sentence length (split very long sentences)
  result = result.replace(/([^.!?]{150,}?)(\s+)(and|but|so|because|which|that)\s/gi, (match, before, space, connector) => {
    if (Math.random() < 0.4) {
      return before + '. ' + connector.charAt(0).toUpperCase() + connector.slice(1) + ' '
    }
    return match
  })

  // Step 6: Final cleanup
  result = result
    .replace(/\s+/g, ' ')
    .replace(/\s+([.!?,])/g, '$1')
    .replace(/([.!?])\s*([a-z])/g, (_, punct, letter) => punct + ' ' + letter.toUpperCase())
    .trim()

  return result
}

// Check how human the text is after humanization
function calculateHumanScore(original: string, humanized: string): number {
  let score = 50

  // Check for added contractions
  const originalContractions = (original.match(/n't|'re|'ve|'ll|'d|'m|'s/g) || []).length
  const humanizedContractions = (humanized.match(/n't|'re|'ve|'ll|'d|'m|'s/g) || []).length
  if (humanizedContractions > originalContractions) {
    score += (humanizedContractions - originalContractions) * 3
  }

  // Check for removed formal words
  const formalWords = /\b(furthermore|moreover|nevertheless|consequently|therefore|additionally|utilize|facilitate|implement|leverage|optimize|delve)\b/gi
  const originalFormal = (original.match(formalWords) || []).length
  const humanizedFormal = (humanized.match(formalWords) || []).length
  score += (originalFormal - humanizedFormal) * 5

  // Check for added natural elements
  const naturalElements = /\b(honestly|actually|basically|really|pretty|kind of|sort of|you know|I mean)\b/gi
  const addedNatural = (humanized.match(naturalElements) || []).length
  score += addedNatural * 4

  // Cap the score
  return Math.min(98, Math.max(30, score))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, mode = 'medium' } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Text must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Count words
    const wordCount = text.trim().split(/\s+/).length

    // Skip humanization for text under 30 words - return as-is for speed
    if (wordCount < 30) {
      return NextResponse.json({
        original: text,
        humanized: text,
        humanScore: 85, // Short text is naturally human-like
        changes: {
          contractionsAdded: 0,
          formalWordsRemoved: 0,
          naturalPhrasesAdded: 0,
        },
        wordCount,
        mode,
        skipped: true,
        reason: 'Text under 30 words - no humanization needed',
      })
    }

    // Perform humanization for longer text
    const humanizedText = advancedHumanize(text, mode as 'light' | 'medium' | 'aggressive')

    // Calculate improvement score
    const humanScore = calculateHumanScore(text, humanizedText)

    // Count changes made
    const changes = {
      contractionsAdded: (humanizedText.match(/n't|'re|'ve|'ll|'d|'m/g) || []).length - (text.match(/n't|'re|'ve|'ll|'d|'m/g) || []).length,
      formalWordsRemoved: (text.match(/\b(furthermore|moreover|nevertheless|consequently|therefore|additionally|utilize|facilitate|implement|leverage|optimize|delve|notwithstanding)\b/gi) || []).length,
      naturalPhrasesAdded: (humanizedText.match(/\b(honestly|actually|basically|really|you know|I mean|the thing is|look,)\b/gi) || []).length,
    }

    return NextResponse.json({
      original: text,
      humanized: humanizedText,
      humanScore,
      changes,
      wordCount: humanizedText.split(/\s+/).length,
      mode,
    })

  } catch (error) {
    console.error('Humanize API error:', error)
    return NextResponse.json(
      { error: 'Failed to humanize text' },
      { status: 500 }
    )
  }
}
