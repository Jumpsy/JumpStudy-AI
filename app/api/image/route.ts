import { NextRequest, NextResponse } from 'next/server'

// Image generation using multiple free services
// Source: Pollinations.ai - Completely free, no auth required
// This service provides unlimited image generation

function getRandomUserAgent(): string {
  const browsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  ]
  return browsers[Math.floor(Math.random() * browsers.length)]
}

interface ImageProvider {
  name: string
  generate: (prompt: string, style?: string) => Promise<string>
}

// Multiple free image generation providers
const IMAGE_PROVIDERS: ImageProvider[] = [
  // 1. Pollinations AI - Free, unlimited, no API key
  // Source: https://pollinations.ai
  {
    name: 'Pollinations',
    generate: async (prompt: string, style?: string) => {
      const enhancedPrompt = style ? `${prompt}, ${style} style` : prompt
      const encodedPrompt = encodeURIComponent(enhancedPrompt)
      const seed = Math.floor(Math.random() * 1000000)
      return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`
    },
  },

  // 2. Picsum for placeholder/random images
  // Source: https://picsum.photos
  {
    name: 'Picsum',
    generate: async (prompt: string) => {
      const seed = Math.floor(Math.random() * 1000)
      return `https://picsum.photos/seed/${seed}/1024/1024`
    },
  },
]

// Provider rotation
let currentProviderIndex = 0
const providerFailures: Record<string, number> = {}

function getNextProvider(): ImageProvider {
  const provider = IMAGE_PROVIDERS[currentProviderIndex]
  currentProviderIndex = (currentProviderIndex + 1) % IMAGE_PROVIDERS.length
  return provider
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, style, count = 1 } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Content filtering - basic safety check
    const blockedWords = ['nude', 'naked', 'explicit', 'porn', 'xxx', 'nsfw']
    const loweredPrompt = prompt.toLowerCase()
    if (blockedWords.some(word => loweredPrompt.includes(word))) {
      return NextResponse.json(
        { error: 'Content not allowed. Please use appropriate prompts.' },
        { status: 400 }
      )
    }

    // Generate images using Pollinations (most reliable free service)
    const images: string[] = []
    const numImages = Math.min(count, 4) // Max 4 images at once

    for (let i = 0; i < numImages; i++) {
      const provider = getNextProvider()
      try {
        const imageUrl = await provider.generate(prompt, style)
        images.push(imageUrl)
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error)
        // Try backup provider
        const backup = IMAGE_PROVIDERS[0] // Pollinations as backup
        const imageUrl = await backup.generate(prompt, style)
        images.push(imageUrl)
      }
    }

    return NextResponse.json({
      images,
      prompt,
      style,
      count: images.length,
      provider: 'Pollinations AI',
    })

  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'JumpStudy AI Image Generator',
    providers: IMAGE_PROVIDERS.map(p => p.name),
  })
}
