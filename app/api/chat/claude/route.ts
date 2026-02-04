import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUseFeature } from '@/lib/pricing'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and plan
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to use Claude' },
        { status: 401 }
      )
    }

    // Get user's plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const userPlan = profile?.plan || 'free'

    // Check if user has Claude access (Code plan)
    if (!canUseFeature(userPlan, 'claude')) {
      return NextResponse.json(
        { error: 'Claude Opus is only available on the Code plan. Please upgrade to access.' },
        { status: 403 }
      )
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Claude API is not configured' },
        { status: 500 }
      )
    }

    const { messages, systemPrompt } = await request.json()

    // Build the request to Anthropic
    const anthropicMessages = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }))

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 8192,
        system: systemPrompt || `You are JumpStudy Code, an expert AI coding assistant powered by Claude Opus. You excel at:

- Writing clean, efficient, well-documented code
- Debugging and fixing errors
- Code reviews and best practices
- Explaining complex programming concepts
- Multi-language support (Python, JavaScript, TypeScript, Java, C++, Rust, Go, etc.)
- Architecture and design patterns
- Database queries and optimization
- DevOps and deployment

Always provide code examples when helpful. Use markdown code blocks with syntax highlighting. Be thorough but concise.`,
        messages: anthropicMessages,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      return NextResponse.json(
        { error: 'Failed to get response from Claude' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const messageContent = data.content?.[0]?.text || 'No response generated'

    return NextResponse.json({
      message: messageContent,
      model: 'claude-opus-4-20250514',
      usage: data.usage,
    })

  } catch (error: any) {
    console.error('Claude chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
