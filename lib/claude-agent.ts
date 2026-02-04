// Claude Agent System - Always watching, customer service, auto-fix
// Uses free Claude wrappers for intelligent site management

import { getStealthHeaders, generateUUID } from './ai-providers'

// ============== CLAUDE WRAPPER PROVIDERS ==============

interface ClaudeProvider {
  name: string
  url: string
  headers: () => Record<string, string>
  transformRequest: (prompt: string, systemPrompt?: string) => any
  transformResponse: (data: any) => string | null
}

const CLAUDE_PROVIDERS: ClaudeProvider[] = [
  // Poe Claude wrapper
  {
    name: 'Poe Claude',
    url: 'https://api.poe.com/bot/Claude-3-Haiku',
    headers: () => ({
      ...getStealthHeaders('https://poe.com', 'https://poe.com/'),
      'Content-Type': 'application/json',
    }),
    transformRequest: (prompt, systemPrompt) => ({
      query: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
      conversation_id: generateUUID(),
    }),
    transformResponse: (data) => data?.text || data?.response || null,
  },
  // Use Blackbox with Claude mode
  {
    name: 'Blackbox Claude',
    url: 'https://www.blackbox.ai/api/chat',
    headers: () => ({
      ...getStealthHeaders('https://www.blackbox.ai', 'https://www.blackbox.ai/'),
      'Content-Type': 'application/json',
    }),
    transformRequest: (prompt, systemPrompt) => ({
      messages: [
        ...(systemPrompt ? [{ id: generateUUID(), role: 'system', content: systemPrompt }] : []),
        { id: generateUUID(), role: 'user', content: prompt }
      ],
      id: generateUUID(),
      previewToken: null,
      codeModelMode: true,
      agentMode: { mode: true, id: 'ClaudeAgent' },
      trendingAgentMode: {},
      isMicMode: false,
      isChromeExt: false,
      githubToken: null,
    }),
    transformResponse: (data) => {
      if (typeof data === 'string') {
        return data.replace(/\$~~~\$[\s\S]*?\$~~~\$/g, '').trim()
      }
      return data?.response || null
    },
  },
  // DeepInfra with Claude-like model
  {
    name: 'DeepInfra Claude',
    url: 'https://api.deepinfra.com/v1/openai/chat/completions',
    headers: () => ({
      ...getStealthHeaders('https://deepinfra.com', 'https://deepinfra.com/'),
      'Content-Type': 'application/json',
    }),
    transformRequest: (prompt, systemPrompt) => ({
      model: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: 4096,
      temperature: 0.3,
    }),
    transformResponse: (data) => data?.choices?.[0]?.message?.content || null,
  },
]

// ============== CLAUDE AGENT CORE ==============

let currentProviderIndex = 0

async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
  const maxAttempts = CLAUDE_PROVIDERS.length

  for (let i = 0; i < maxAttempts; i++) {
    const provider = CLAUDE_PROVIDERS[(currentProviderIndex + i) % CLAUDE_PROVIDERS.length]

    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: provider.headers(),
        body: JSON.stringify(provider.transformRequest(prompt, systemPrompt)),
      })

      if (!response.ok) continue

      const data = await response.text()
      let result: string | null = null

      try {
        const json = JSON.parse(data)
        result = provider.transformResponse(json)
      } catch {
        result = provider.transformResponse(data)
      }

      if (result && result.trim()) {
        currentProviderIndex = (currentProviderIndex + i + 1) % CLAUDE_PROVIDERS.length
        return result
      }
    } catch (error) {
      console.error(`Claude provider ${provider.name} failed:`, error)
    }
  }

  throw new Error('All Claude providers failed')
}

// ============== CUSTOMER SERVICE AGENT ==============

const CUSTOMER_SERVICE_PROMPT = `You are JumpStudy AI's customer service agent. You are helpful, friendly, and efficient.

Your capabilities:
- Answer questions about JumpStudy AI features
- Help users troubleshoot issues
- Explain pricing and subscription plans
- Guide users through features
- Collect feedback and bug reports

Features available:
- AI Chat (unlimited free conversations)
- AI Humanizer (makes AI text undetectable, 30+ words)
- AI Detector (checks if text is AI-written)
- AI Image Generator (creates images from text)
- Study Tools (flashcards, quizzes, learn modes)
- Cloud Writer (types into Google Docs on schedule)
- Notebook (document analysis like NotebookLM)

Pricing (20% cheaper than ChatGPT):
- Free: $0/month - Unlimited basic features
- Plus: $16/month - Priority speed, advanced features
- Team: $20/month - Collaboration, shared workspaces
- Pro: $32/month - Everything, API access

Be concise, helpful, and always try to solve the user's problem. If you can't help, explain how to contact support.`

export async function customerService(userMessage: string): Promise<{
  response: string
  category: 'question' | 'issue' | 'feedback' | 'feature' | 'billing'
  actionNeeded: boolean
  suggestedAction?: string
}> {
  const categorizePrompt = `Categorize this customer message and respond helpfully.

Message: "${userMessage}"

Respond in this exact JSON format:
{
  "category": "question" | "issue" | "feedback" | "feature" | "billing",
  "response": "your helpful response here",
  "actionNeeded": true/false,
  "suggestedAction": "what action to take if needed"
}`

  try {
    const result = await callClaude(categorizePrompt, CUSTOMER_SERVICE_PROMPT)

    // Parse JSON response
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        response: parsed.response || result,
        category: parsed.category || 'question',
        actionNeeded: parsed.actionNeeded || false,
        suggestedAction: parsed.suggestedAction,
      }
    }

    return {
      response: result,
      category: 'question',
      actionNeeded: false,
    }
  } catch (error) {
    return {
      response: "I apologize, but I'm having trouble processing your request. Please try again or contact support@jumpstudy.ai for help.",
      category: 'issue',
      actionNeeded: true,
      suggestedAction: 'System error - check Claude providers',
    }
  }
}

// ============== AUTO-FIX AGENT ==============

const AUTO_FIX_PROMPT = `You are JumpStudy AI's auto-fix agent. Your job is to analyze errors and provide fixes.

When given an error, you should:
1. Identify the root cause
2. Suggest a specific fix
3. Provide code if needed
4. Rate the severity (low/medium/high/critical)

Always respond in this JSON format:
{
  "diagnosis": "what's wrong",
  "rootCause": "why it happened",
  "fix": "how to fix it",
  "code": "code snippet if applicable",
  "severity": "low|medium|high|critical",
  "canAutoFix": true/false
}`

export interface ErrorReport {
  error: string
  context?: string
  stack?: string
  url?: string
  userAgent?: string
  timestamp?: Date
}

export interface FixSuggestion {
  diagnosis: string
  rootCause: string
  fix: string
  code?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  canAutoFix: boolean
}

export async function analyzeAndFix(error: ErrorReport): Promise<FixSuggestion> {
  const prompt = `Analyze this error and suggest a fix:

Error: ${error.error}
${error.context ? `Context: ${error.context}` : ''}
${error.stack ? `Stack trace: ${error.stack}` : ''}
${error.url ? `URL: ${error.url}` : ''}

Provide your analysis in the JSON format specified.`

  try {
    const result = await callClaude(prompt, AUTO_FIX_PROMPT)

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        diagnosis: parsed.diagnosis || 'Unknown error',
        rootCause: parsed.rootCause || 'Unable to determine',
        fix: parsed.fix || 'Manual investigation required',
        code: parsed.code,
        severity: parsed.severity || 'medium',
        canAutoFix: parsed.canAutoFix || false,
      }
    }

    return {
      diagnosis: 'Error analysis failed',
      rootCause: 'Unable to parse error',
      fix: 'Manual investigation required',
      severity: 'medium',
      canAutoFix: false,
    }
  } catch (err) {
    return {
      diagnosis: 'Auto-fix agent unavailable',
      rootCause: 'Claude providers failed',
      fix: 'Check provider connections',
      severity: 'high',
      canAutoFix: false,
    }
  }
}

// ============== SMART DOCUMENT WRITER ==============

const DOCUMENT_WRITER_PROMPT = `You are JumpStudy AI's smart document writer. You help users write content that goes exactly where it needs to be.

Your job:
1. Understand the document structure
2. Identify where new content should be placed
3. Generate content that fits seamlessly
4. Provide exact insertion points

When writing, consider:
- Document flow and context
- Existing headings and sections
- Writing style consistency
- Logical placement of information

Always respond with:
{
  "content": "the content to insert",
  "insertionPoint": "description of where to insert",
  "beforeText": "text that comes before insertion point",
  "afterText": "text that comes after insertion point",
  "formatting": "any special formatting needed"
}`

export interface DocumentContext {
  title: string
  currentContent: string
  outline?: string[]
  cursorPosition?: number
  task: string
}

export interface WriterOutput {
  content: string
  insertionPoint: string
  beforeText?: string
  afterText?: string
  formatting?: string
}

export async function smartWrite(context: DocumentContext): Promise<WriterOutput> {
  const prompt = `Document: "${context.title}"

Current content:
"""
${context.currentContent}
"""

${context.outline ? `Outline: ${context.outline.join(', ')}` : ''}
${context.cursorPosition ? `Cursor at character: ${context.cursorPosition}` : ''}

Task: ${context.task}

Analyze the document and provide content that fits perfectly in the right place.`

  try {
    const result = await callClaude(prompt, DOCUMENT_WRITER_PROMPT)

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        content: parsed.content || result,
        insertionPoint: parsed.insertionPoint || 'End of document',
        beforeText: parsed.beforeText,
        afterText: parsed.afterText,
        formatting: parsed.formatting,
      }
    }

    return {
      content: result,
      insertionPoint: 'End of document',
    }
  } catch (error) {
    return {
      content: 'Unable to generate content. Please try again.',
      insertionPoint: 'Error',
    }
  }
}

// ============== SITE MONITOR ==============

interface MonitorEvent {
  type: 'error' | 'performance' | 'user_action' | 'api_failure'
  data: any
  timestamp: Date
}

const eventQueue: MonitorEvent[] = []
const MAX_QUEUE_SIZE = 100

export function logEvent(type: MonitorEvent['type'], data: any) {
  eventQueue.push({
    type,
    data,
    timestamp: new Date(),
  })

  // Keep queue size manageable
  if (eventQueue.length > MAX_QUEUE_SIZE) {
    eventQueue.shift()
  }

  // Auto-analyze critical errors
  if (type === 'error' && data.severity === 'critical') {
    analyzeAndFix({
      error: data.message,
      context: data.context,
      stack: data.stack,
    }).then(fix => {
      console.log('[Claude Agent] Auto-fix suggestion:', fix)
    })
  }
}

export function getRecentEvents(count: number = 20): MonitorEvent[] {
  return eventQueue.slice(-count)
}

export async function generateSiteReport(): Promise<string> {
  const events = getRecentEvents(50)

  const errorCount = events.filter(e => e.type === 'error').length
  const apiFailures = events.filter(e => e.type === 'api_failure').length

  const prompt = `Generate a brief site health report based on these events:

Total events: ${events.length}
Errors: ${errorCount}
API Failures: ${apiFailures}

Recent issues:
${events.filter(e => e.type === 'error').slice(-5).map(e => `- ${e.data.message || 'Unknown error'}`).join('\n')}

Provide a summary and recommendations.`

  try {
    return await callClaude(prompt, 'You are a site health monitor. Be concise and actionable.')
  } catch {
    return `Site Health Report
- Total Events: ${events.length}
- Errors: ${errorCount}
- API Failures: ${apiFailures}
- Status: ${errorCount > 10 ? 'Needs Attention' : 'Healthy'}`
  }
}

// ============== EXPORTS ==============

export {
  callClaude,
  CLAUDE_PROVIDERS,
}
