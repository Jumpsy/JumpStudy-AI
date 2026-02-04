import { NextRequest, NextResponse } from 'next/server'
import {
  AI_PROVIDERS,
  getNextChatProvider,
  markProviderFailed,
  markProviderSuccess,
  SYSTEM_PROMPT,
  isCodingQuestion,
  needsWebResearch,
  webSearch,
  formatSearchResults,
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

// Fast provider request with timeout
async function tryProvider(
  provider: typeof AI_PROVIDERS[0],
  messages: any[],
  timeoutMs: number = 8000
): Promise<{ content: string; provider: string; model: string } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: provider.headers(),
      body: JSON.stringify(provider.transformRequest(messages)),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    let responseText: string

    if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
      responseText = await response.text()
    } else {
      const data = await response.json()
      responseText = JSON.stringify(data)
    }

    let content: string | null = null
    try {
      const parsed = JSON.parse(responseText)
      content = provider.transformResponse(parsed)
    } catch {
      content = provider.transformResponse(responseText)
    }

    if (content && content.trim().length > 0) {
      markProviderSuccess(provider.name)
      return { content, provider: provider.name, model: provider.model }
    }

    throw new Error('Empty response')
  } catch (error) {
    clearTimeout(timeout)
    markProviderFailed(provider.name)
    return null
  }
}

// Race multiple providers for fastest response
async function raceProviders(
  messages: any[],
  numProviders: number = 3
): Promise<{ content: string; provider: string; model: string } | null> {
  const providers: typeof AI_PROVIDERS[0][] = []

  // Get multiple providers to race
  for (let i = 0; i < numProviders; i++) {
    providers.push(getNextChatProvider())
  }

  console.log(`Racing ${providers.length} providers: ${providers.map(p => p.name).join(', ')}`)

  // Race all providers - first valid response wins
  const results = await Promise.allSettled(
    providers.map(p => tryProvider(p, messages, 10000))
  )

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

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
    let searchResults: any[] | undefined
    let augmentedMessages = messages

    // Only do web search for longer, complex queries (skip for speed on simple messages)
    const shouldSearch = needsWebResearch(lastUserMessage) && lastUserMessage.length > 20

    if (shouldSearch) {
      try {
        // Run search with tight timeout
        const searchPromise = webSearch(lastUserMessage)
        const timeoutPromise = new Promise<any[]>((_, reject) =>
          setTimeout(() => reject(new Error('Search timeout')), 3000)
        )

        searchResults = await Promise.race([searchPromise, timeoutPromise])

        if (searchResults && searchResults.length > 0) {
          const searchContext = formatSearchResults(searchResults)
          augmentedMessages = [
            ...messages.slice(0, -1),
            {
              role: 'user',
              content: `${searchContext}\n\nUser's question: ${lastUserMessage}\n\nPlease use the search results above to answer the question accurately and cite sources when relevant.`,
            },
          ]
        }
      } catch (error) {
        // Search failed or timed out - continue without it for speed
      }
    }

    const isCoding = isCodingQuestion(lastUserMessage)

    // Prepare messages with system prompt
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...augmentedMessages,
    ]

    // Race multiple providers for fastest response
    const result = await raceProviders(fullMessages, 3)

    if (result) {
      const responseTime = Date.now() - startTime
      console.log(`Response from ${result.provider} in ${responseTime}ms`)

      return NextResponse.json({
        message: result.content,
        model: result.model,
        provider: result.provider,
        hasSearchResults: !!searchResults?.length,
        isCodingResponse: isCoding,
        responseTime,
      })
    }

    // All providers failed - try one more time sequentially with longer timeout
    for (let i = 0; i < AI_PROVIDERS.length; i++) {
      const provider = getNextChatProvider()
      const result = await tryProvider(provider, fullMessages, 15000)

      if (result) {
        return NextResponse.json({
          message: result.content,
          model: result.model,
          provider: result.provider,
          hasSearchResults: !!searchResults?.length,
          isCodingResponse: isCoding,
        })
      }
    }

    // Ultimate fallback
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
