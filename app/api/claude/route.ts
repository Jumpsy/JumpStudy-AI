import { NextRequest, NextResponse } from 'next/server'
import {
  customerService,
  analyzeAndFix,
  smartWrite,
  logEvent,
  generateSiteReport,
} from '@/lib/claude-agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'customer-service': {
        const result = await customerService(data.message)
        return NextResponse.json(result)
      }

      case 'analyze-error': {
        const fix = await analyzeAndFix({
          error: data.error,
          context: data.context,
          stack: data.stack,
          url: data.url,
        })
        return NextResponse.json(fix)
      }

      case 'smart-write': {
        const output = await smartWrite({
          title: data.title,
          currentContent: data.content,
          outline: data.outline,
          cursorPosition: data.cursorPosition,
          task: data.task,
        })
        return NextResponse.json(output)
      }

      case 'log-event': {
        logEvent(data.type, data.data)
        return NextResponse.json({ success: true })
      }

      case 'site-report': {
        const report = await generateSiteReport()
        return NextResponse.json({ report })
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Claude API error:', error)
    return NextResponse.json(
      { error: error.message || 'Claude agent failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    agent: 'Claude Agent',
    capabilities: [
      'customer-service',
      'analyze-error',
      'smart-write',
      'log-event',
      'site-report',
    ],
  })
}
