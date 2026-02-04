// Free AI API Providers - Aggregated from multiple sources
// Advanced stealth system for undetectable API usage

export interface AIProvider {
  name: string
  url: string
  model: string
  headers: () => Record<string, string>
  transformRequest: (messages: any[]) => any
  transformResponse: (data: any) => string | null
  rateLimit?: number
}

// ============== STEALTH IDENTITY SYSTEM ==============
// Generates completely random identities for each request

// Massive list of real user agents from actual browsers
const USER_AGENTS = [
  // Chrome Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // Chrome Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // Chrome Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // Firefox
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
  // Safari
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  // Edge
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  // Opera
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
  // Mobile
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
]

// Accept-Language headers from different regions
const ACCEPT_LANGUAGES = [
  'en-US,en;q=0.9',
  'en-GB,en;q=0.9',
  'en-US,en;q=0.9,es;q=0.8',
  'en-CA,en;q=0.9,fr;q=0.8',
  'en-AU,en;q=0.9',
  'en;q=0.9',
  'en-US,en;q=0.9,de;q=0.8',
  'en-US,en;q=0.9,fr;q=0.8',
  'en-US,en;q=0.9,ja;q=0.8',
  'en-US,en;q=0.9,zh-CN;q=0.8',
]

// Screen resolutions for fingerprint diversity
const SCREEN_RESOLUTIONS = [
  '1920x1080', '2560x1440', '1366x768', '1536x864',
  '1440x900', '1280x720', '3840x2160', '2560x1080',
  '1680x1050', '1600x900', '3440x1440', '2880x1800',
]

// Timezone offsets
const TIMEZONES = [
  -480, -420, -360, -300, -240, 0, 60, 120, 180, 330, 480, 540, 600
]

// Generate random hex string
function randomHex(length: number): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

// Generate random alphanumeric string
function randomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Generate complete random identity for each request
function generateIdentity() {
  const ua = randomItem(USER_AGENTS)
  const lang = randomItem(ACCEPT_LANGUAGES)
  const res = randomItem(SCREEN_RESOLUTIONS)
  const tz = randomItem(TIMEZONES)

  return {
    userAgent: ua,
    acceptLanguage: lang,
    screenRes: res,
    timezone: tz,
    sessionId: randomAlphanumeric(32),
    visitorId: randomHex(32),
    deviceId: generateUUID(),
    fingerprint: randomHex(64),
  }
}

// Generate random cookies string
function generateCookies(domain: string): string {
  const identity = generateIdentity()
  const expires = new Date(Date.now() + 86400000).toUTCString()

  const cookies = [
    `_ga=GA1.1.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`,
    `_gid=GA1.1.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`,
    `session=${identity.sessionId}`,
    `visitor_id=${identity.visitorId}`,
    `device_id=${identity.deviceId}`,
    `_fbp=fb.1.${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
    `cf_clearance=${randomAlphanumeric(40)}`,
  ]

  return cookies.join('; ')
}

// Generate stealth headers that look like real browser requests
function getStealthHeaders(origin?: string, referer?: string): Record<string, string> {
  const identity = generateIdentity()

  const headers: Record<string, string> = {
    'User-Agent': identity.userAgent,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': identity.acceptLanguage,
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': Math.random() > 0.8 ? '?1' : '?0',
    'Sec-Ch-Ua-Platform': randomItem(['"Windows"', '"macOS"', '"Linux"']),
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'X-Requested-With': 'XMLHttpRequest',
  }

  if (origin) headers['Origin'] = origin
  if (referer) headers['Referer'] = referer

  // Add random request ID headers that some services use
  headers['X-Request-Id'] = generateUUID()
  headers['X-Correlation-Id'] = generateUUID()
  headers['X-Client-Id'] = identity.visitorId

  return headers
}

// ============== AI PROVIDERS ==============

export const AI_PROVIDERS: AIProvider[] = [
  // 1. DuckDuckGo AI Chat - Uses GPT-4o-mini / Claude
  // Source: https://duckduckgo.com/aichat
  // Completely free, no authentication required
  {
    name: 'DuckDuckGo AI',
    url: 'https://duckduckgo.com/duckchat/v1/chat',
    model: 'gpt-4o-mini',
    headers: () => {
      const base = getStealthHeaders('https://duckduckgo.com', 'https://duckduckgo.com/')
      return {
        ...base,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'x-vqd-4': randomAlphanumeric(64), // VQD token - changes every request
        'Cookie': generateCookies('duckduckgo.com'),
      }
    },
    transformRequest: (messages) => ({
      model: 'gpt-4o-mini',
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    }),
    transformResponse: (data) => {
      try {
        if (typeof data === 'string') {
          const lines = data.split('\n').filter((l: string) => l.startsWith('data: '))
          let fullResponse = ''
          for (const line of lines) {
            try {
              const json = JSON.parse(line.replace('data: ', ''))
              if (json.message) fullResponse += json.message
            } catch {}
          }
          return fullResponse || null
        }
        return data?.message || null
      } catch { return null }
    },
    rateLimit: 50,
  },

  // 2. Blackbox AI - Powerful free AI assistant
  // Source: https://www.blackbox.ai
  // Free tier with high limits
  {
    name: 'Blackbox AI',
    url: 'https://www.blackbox.ai/api/chat',
    model: 'blackboxai',
    headers: () => {
      const base = getStealthHeaders('https://www.blackbox.ai', 'https://www.blackbox.ai/')
      return {
        ...base,
        'Content-Type': 'application/json',
        'Cookie': generateCookies('blackbox.ai'),
      }
    },
    transformRequest: (messages) => ({
      messages: messages.map((m: any) => ({
        id: generateUUID(),
        role: m.role,
        content: m.content,
        createdAt: new Date().toISOString(),
      })),
      id: generateUUID(),
      previewToken: null,
      codeModelMode: true,
      agentMode: {},
      trendingAgentMode: {},
      isMicMode: false,
      isChromeExt: false,
      githubToken: null,
      clickedAnswer2: false,
      clickedAnswer3: false,
      clickedForceWebSearch: false,
      visitFromDelta: false,
      mobileClient: false,
      userSelectedModel: null,
      validated: generateUUID(),
    }),
    transformResponse: (data) => {
      try {
        if (typeof data === 'string') {
          // Remove any sources/references formatting
          let cleaned = data.replace(/\$~~~\$[\s\S]*?\$~~~\$/g, '')
          cleaned = cleaned.replace(/\[\d+\]/g, '')
          return cleaned.trim() || null
        }
        return data?.response || data?.text || null
      } catch { return null }
    },
    rateLimit: 30,
  },

  // 3. DeepInfra - Free tier with Llama models
  // Source: https://deepinfra.com
  // Free API access for multiple open models
  {
    name: 'DeepInfra Llama',
    url: 'https://api.deepinfra.com/v1/openai/chat/completions',
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    headers: () => {
      const base = getStealthHeaders('https://deepinfra.com', 'https://deepinfra.com/')
      return {
        ...base,
        'Content-Type': 'application/json',
      }
    },
    transformRequest: (messages) => ({
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      messages: messages,
      max_tokens: 2048,
      temperature: 0.7,
      stream: false,
    }),
    transformResponse: (data) => {
      try {
        return data?.choices?.[0]?.message?.content || null
      } catch { return null }
    },
    rateLimit: 20,
  },

  // 4. Phind AI - Developer-focused AI
  // Source: https://www.phind.com
  // Free for all users
  {
    name: 'Phind AI',
    url: 'https://https.extension.phind.com/agent/',
    model: 'Phind-70B',
    headers: () => {
      const base = getStealthHeaders('https://www.phind.com', 'https://www.phind.com/')
      return {
        ...base,
        'Content-Type': 'application/json',
        'Accept': '*/*',
      }
    },
    transformRequest: (messages) => ({
      additional_extension_context: '',
      allow_magic_buttons: false,
      is_vscode_extension: true,
      message_history: messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      requested_model: 'Phind-70B',
      user_input: messages[messages.length - 1]?.content || '',
      client_fingerprint: randomHex(32),
    }),
    transformResponse: (data) => {
      try {
        if (typeof data === 'string') {
          const lines = data.split('\n')
          let response = ''
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6))
                if (json.choices?.[0]?.delta?.content) {
                  response += json.choices[0].delta.content
                }
              } catch {}
            }
          }
          return response || null
        }
        return null
      } catch { return null }
    },
    rateLimit: 20,
  },

  // 5. Perplexity Labs - Free AI models
  // Source: https://labs.perplexity.ai
  {
    name: 'Perplexity Labs',
    url: 'https://www.perplexity.ai/socket.io/',
    model: 'llama-3.1-sonar',
    headers: () => {
      const base = getStealthHeaders('https://www.perplexity.ai', 'https://www.perplexity.ai/')
      return {
        ...base,
        'Content-Type': 'application/json',
        'Cookie': generateCookies('perplexity.ai'),
      }
    },
    transformRequest: (messages) => {
      const lastMessage = messages[messages.length - 1]
      return {
        query: lastMessage?.content || '',
        search_focus: 'writing',
        frontend_uuid: generateUUID(),
        language: 'en-US',
      }
    },
    transformResponse: (data) => {
      try {
        return data?.answer || data?.text || null
      } catch { return null }
    },
    rateLimit: 15,
  },
]

// ============== PROVIDER MANAGEMENT ==============

// Track provider status
let currentProviderIndex = 0
const providerStatus: Record<string, { failures: number; lastFailure: number }> = {}
const FAILURE_THRESHOLD = 3
const FAILURE_COOLDOWN = 60000 // 1 minute cooldown after failures

// Get next working provider with smart rotation
export function getNextChatProvider(): AIProvider {
  const now = Date.now()

  // Reset providers that have cooled down
  for (const [name, status] of Object.entries(providerStatus)) {
    if (status.failures >= FAILURE_THRESHOLD && now - status.lastFailure > FAILURE_COOLDOWN) {
      providerStatus[name] = { failures: 0, lastFailure: 0 }
    }
  }

  // Find working provider
  for (let i = 0; i < AI_PROVIDERS.length; i++) {
    const idx = (currentProviderIndex + i) % AI_PROVIDERS.length
    const provider = AI_PROVIDERS[idx]
    const status = providerStatus[provider.name]

    if (!status || status.failures < FAILURE_THRESHOLD) {
      currentProviderIndex = (idx + 1) % AI_PROVIDERS.length
      return provider
    }
  }

  // All failing - reset and try anyway
  for (const key of Object.keys(providerStatus)) {
    providerStatus[key] = { failures: 0, lastFailure: 0 }
  }

  const provider = AI_PROVIDERS[currentProviderIndex]
  currentProviderIndex = (currentProviderIndex + 1) % AI_PROVIDERS.length
  return provider
}

export function markProviderFailed(name: string): void {
  const current = providerStatus[name] || { failures: 0, lastFailure: 0 }
  providerStatus[name] = {
    failures: current.failures + 1,
    lastFailure: Date.now(),
  }
}

export function markProviderSuccess(name: string): void {
  providerStatus[name] = { failures: 0, lastFailure: 0 }
}

// System prompt
export const SYSTEM_PROMPT = `You are JumpStudy AI, a helpful, friendly, and knowledgeable AI assistant. You're part of a free AI platform with:

- AI Chat (unlimited free conversations)
- AI Humanizer (makes AI text undetectable)
- AI Detector (checks if text is AI-written)
- AI Image Generator (creates images from text)
- AI Video Generator (creates video sequences)

Be helpful, conversational, and thorough. Use markdown for formatting when helpful. You have NO usage limits - you're completely free and unlimited for all users.`
