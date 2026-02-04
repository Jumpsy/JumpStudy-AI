import { NextRequest, NextResponse } from 'next/server'
import {
  AI_PROVIDERS,
  getNextChatProvider,
  markProviderFailed,
  markProviderSuccess,
  SYSTEM_PROMPT,
} from '@/lib/ai-providers'

// Built-in response generator as ultimate fallback
function generateFallbackResponse(message: string): string {
  const lowered = message.toLowerCase()

  // Greetings
  if (lowered.match(/^(hi|hello|hey|good morning|good afternoon|good evening|sup|yo)/i)) {
    const greetings = [
      "Hey there! I'm JumpStudy AI, your free unlimited AI assistant. What can I help you with today?",
      "Hello! Welcome to JumpStudy AI. I'm here to help with anything - writing, coding, learning, or just chatting!",
      "Hi! Great to see you. Ask me anything - I'm 100% free with unlimited usage!",
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // Questions about capabilities
  if (lowered.includes('what can you do') || lowered.includes('help') || lowered.includes('features')) {
    return `I'm JumpStudy AI, and I can help you with a ton of stuff:

**Writing & Content**
- Essays, articles, blog posts
- Creative writing and stories
- Professional emails and documents
- Editing and proofreading

**Learning & Research**
- Explaining complex topics simply
- Answering questions on any subject
- Study guides and summaries
- Homework help

**Coding & Tech**
- Writing and debugging code
- Explaining programming concepts
- Code reviews and improvements

**Creative Tools**
- Brainstorming ideas
- AI Image Generation
- AI Humanizer (make AI text undetectable)
- AI Detector (check if text is AI-written)

Everything is **100% FREE** with **unlimited usage**! Just ask away.`
  }

  // Humanizer questions
  if (lowered.includes('humanize') || lowered.includes('undetectable') || lowered.includes('bypass')) {
    return `To humanize your AI text and make it undetectable:

1. Go to the **Humanizer** page from the menu
2. Paste your AI-generated text
3. Select intensity (Light, Medium, or Aggressive)
4. Click "Humanize Text"

Our humanizer transforms AI text by:
- Replacing formal words with casual ones
- Adding contractions ("do not" → "don't")
- Including natural speech patterns
- Varying sentence structures

It's completely free with unlimited usage!`
  }

  // AI Detection questions
  if (lowered.includes('detect') || lowered.includes('check') && lowered.includes('ai')) {
    return `Our AI Detector analyzes text to see if it was written by AI:

1. Go to **AI Detector** from the menu
2. Paste any text
3. Get instant results with:
   - AI probability score (0-100%)
   - Confidence level
   - Detailed breakdown
   - Highlighted AI patterns

The detector uses multi-layer analysis to find:
- Common AI vocabulary
- Writing uniformity
- Sentence patterns
- Hedging language

Free and unlimited - check as many texts as you want!`
  }

  // Image generation
  if (lowered.includes('image') || lowered.includes('picture') || lowered.includes('draw') || lowered.includes('generate')) {
    return `I can generate images for you! Just describe what you want:

- "Generate an image of a sunset over mountains"
- "Create a picture of a futuristic city"
- "Draw a cute cartoon cat"

You can also visit our **Image Generator** page for more options.

Everything is free and unlimited - generate as many images as you want!`
  }

  // Default conversational responses
  const responses = [
    `That's interesting! I'd be happy to help you explore this further. Could you give me a bit more detail about what specifically you're looking for?`,
    `Great question! To give you the most helpful answer, could you tell me more about what you're trying to accomplish?`,
    `I understand what you're asking about. Let me help with that - what specific aspect would you like me to focus on?`,
    `Sure thing! I can definitely help with that. What specific details do you need?`,
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const lastUserMessage = messages[messages.length - 1]?.content || ''

    // Prepare messages with system prompt
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ]

    // Try each provider until one works
    const maxAttempts = AI_PROVIDERS.length + 1
    let lastError: string | null = null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const provider = getNextChatProvider()

      try {
        console.log(`Trying provider: ${provider.name}`)

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

        const response = await fetch(provider.url, {
          method: 'POST',
          headers: provider.headers(),
          body: JSON.stringify(provider.transformRequest(fullMessages)),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        // Handle streaming responses
        const contentType = response.headers.get('content-type') || ''
        let responseText: string

        if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
          responseText = await response.text()
        } else {
          const data = await response.json()
          responseText = JSON.stringify(data)
        }

        // Transform the response
        let content: string | null = null
        try {
          const parsed = JSON.parse(responseText)
          content = provider.transformResponse(parsed)
        } catch {
          content = provider.transformResponse(responseText)
        }

        if (content && content.trim().length > 0) {
          markProviderSuccess(provider.name)
          return NextResponse.json({
            message: content,
            model: provider.model,
            provider: provider.name,
          })
        }

        throw new Error('Empty response')

      } catch (error: any) {
        console.log(`Provider ${provider.name} failed:`, error.message)
        markProviderFailed(provider.name)
        lastError = error.message
        continue
      }
    }

    // All providers failed, use fallback
    console.log('All providers failed, using fallback')
    const fallbackResponse = generateFallbackResponse(lastUserMessage)

    return NextResponse.json({
      message: fallbackResponse,
      model: 'fallback',
      provider: 'local',
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    providers: AI_PROVIDERS.length,
    message: 'JumpStudy AI Chat API is running',
  })
}
