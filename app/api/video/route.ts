import { NextRequest, NextResponse } from 'next/server'

// Video generation using free services
// Note: True AI video generation requires significant compute
// We provide animated image/GIF generation as an alternative

function getRandomUserAgent(): string {
  const browsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  ]
  return browsers[Math.floor(Math.random() * browsers.length)]
}

interface VideoProvider {
  name: string
  type: 'gif' | 'video' | 'animation'
  generate: (prompt: string, duration?: number) => Promise<{ url: string; type: string }>
}

// Free video/animation providers
const VIDEO_PROVIDERS: VideoProvider[] = [
  // 1. Pollinations AI with animation parameters
  // Creates animated sequences
  {
    name: 'Pollinations Animation',
    type: 'gif',
    generate: async (prompt: string) => {
      const seed = Math.floor(Math.random() * 1000000)
      const frames: string[] = []

      // Generate multiple frames for animation effect
      for (let i = 0; i < 4; i++) {
        const framePrompt = encodeURIComponent(`${prompt}, frame ${i + 1} of animation sequence`)
        frames.push(`https://image.pollinations.ai/prompt/${framePrompt}?width=512&height=512&seed=${seed + i}&nologo=true`)
      }

      // Return first frame as preview, all frames in response
      return {
        url: frames[0],
        type: 'animation_frames',
      }
    },
  },

  // 2. Giphy for existing GIFs based on keywords
  // Source: https://giphy.com
  {
    name: 'Giphy Search',
    type: 'gif',
    generate: async (prompt: string) => {
      // Use Giphy's random endpoint with search term
      const encodedPrompt = encodeURIComponent(prompt)
      const url = `https://media.giphy.com/media/v1.random/g?tag=${encodedPrompt}`
      return {
        url: `https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=${encodedPrompt}`,
        type: 'gif_search',
      }
    },
  },
]

let currentProviderIndex = 0

function getNextProvider(): VideoProvider {
  const provider = VIDEO_PROVIDERS[currentProviderIndex]
  currentProviderIndex = (currentProviderIndex + 1) % VIDEO_PROVIDERS.length
  return provider
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, duration = 3, style } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Content filtering
    const blockedWords = ['nude', 'naked', 'explicit', 'porn', 'xxx', 'nsfw']
    const loweredPrompt = prompt.toLowerCase()
    if (blockedWords.some(word => loweredPrompt.includes(word))) {
      return NextResponse.json(
        { error: 'Content not allowed. Please use appropriate prompts.' },
        { status: 400 }
      )
    }

    // For video generation, we use animated image sequences
    const enhancedPrompt = style ? `${prompt}, ${style} style, cinematic, dynamic motion` : `${prompt}, cinematic, dynamic motion`
    const seed = Math.floor(Math.random() * 1000000)

    // Generate multiple frames for video-like experience
    const frames: string[] = []
    for (let i = 0; i < Math.min(duration * 2, 8); i++) {
      const framePrompt = encodeURIComponent(`${enhancedPrompt}, frame ${i + 1}, sequence shot`)
      frames.push(`https://image.pollinations.ai/prompt/${framePrompt}?width=768&height=432&seed=${seed + i * 100}&nologo=true`)
    }

    // Also provide a static preview
    const previewPrompt = encodeURIComponent(enhancedPrompt)
    const preview = `https://image.pollinations.ai/prompt/${previewPrompt}?width=768&height=432&seed=${seed}&nologo=true`

    return NextResponse.json({
      frames,
      preview,
      prompt: enhancedPrompt,
      duration,
      frameCount: frames.length,
      type: 'image_sequence',
      message: 'Generated image sequence. For full video, frames can be combined into animation.',
      provider: 'Pollinations AI',
    })

  } catch (error: any) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate video. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'JumpStudy AI Video Generator',
    note: 'Generates image sequences that can be animated',
  })
}
