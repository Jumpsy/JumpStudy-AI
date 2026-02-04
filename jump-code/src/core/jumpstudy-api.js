/**
 * Jump Code - JumpStudy API Integration
 * Provides FREE and UNLIMITED AI access through JumpStudy's infrastructure
 *
 * This is the wrapper that makes Jump Code free for all users.
 * JumpStudy absorbs the API costs and provides unlimited access.
 */

export class JumpStudyAPI {
  constructor(options = {}) {
    // JumpStudy API endpoint - this proxies to AI providers
    this.baseURL = options.baseURL || process.env.JUMPSTUDY_API_URL || 'https://api.jumpstudy.co/v1';
    this.apiKey = options.apiKey || process.env.JUMPSTUDY_API_KEY || 'jump-code-free';

    // Client identification
    this.clientId = 'jump-code-cli';
    this.clientVersion = '1.0.0';

    // Rate limiting (generous limits for free tier)
    this.requestsPerMinute = 60;
    this.requestsThisMinute = 0;
    this.lastResetTime = Date.now();

    // Usage tracking
    this.totalRequests = 0;
    this.totalTokens = 0;
  }

  /**
   * Make a chat completion request through JumpStudy's free API
   */
  async chatCompletion(messages, options = {}) {
    await this.checkRateLimit();

    const payload = {
      model: options.model || 'gpt-4o',
      messages: messages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      stream: options.stream || false,
      // JumpStudy-specific fields
      client: this.clientId,
      version: this.clientVersion,
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-ID': this.clientId,
          'X-Client-Version': this.clientVersion,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Track usage
      this.totalRequests++;
      if (data.usage) {
        this.totalTokens += data.usage.total_tokens || 0;
      }

      return data;
    } catch (error) {
      // If JumpStudy API is unavailable, fall back to local processing or retry
      if (error.message.includes('fetch')) {
        throw new Error('JumpStudy API is temporarily unavailable. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Stream a chat completion
   */
  async *chatCompletionStream(messages, options = {}) {
    await this.checkRateLimit();

    const payload = {
      model: options.model || 'gpt-4o',
      messages: messages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      stream: true,
      client: this.clientId,
      version: this.clientVersion,
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-ID': this.clientId,
          'X-Client-Version': this.clientVersion,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      throw error;
    }

    this.totalRequests++;
  }

  /**
   * Analyze an image (vision capability)
   */
  async analyzeImage(imageBase64, prompt, options = {}) {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${imageBase64}`,
            },
          },
        ],
      },
    ];

    return this.chatCompletion(messages, {
      ...options,
      model: options.model || 'gpt-4o', // Vision-capable model
    });
  }

  /**
   * Generate code with specialized prompting
   */
  async generateCode(prompt, language, options = {}) {
    const systemMessage = {
      role: 'system',
      content: `You are Jump Code, an expert code generator. Generate clean, efficient, well-documented ${language} code. Follow best practices and include helpful comments.`,
    };

    const messages = [systemMessage, { role: 'user', content: prompt }];

    return this.chatCompletion(messages, options);
  }

  /**
   * Explain code
   */
  async explainCode(code, options = {}) {
    const messages = [
      {
        role: 'system',
        content: 'You are Jump Code. Explain code clearly and concisely, covering what it does, how it works, and any important concepts.',
      },
      {
        role: 'user',
        content: `Explain this code:\n\n\`\`\`\n${code}\n\`\`\``,
      },
    ];

    return this.chatCompletion(messages, options);
  }

  /**
   * Fix/debug code
   */
  async fixCode(code, error, options = {}) {
    const messages = [
      {
        role: 'system',
        content: 'You are Jump Code. Analyze the code and error, identify the issue, and provide a corrected version with explanation.',
      },
      {
        role: 'user',
        content: `Fix this code:\n\n\`\`\`\n${code}\n\`\`\`\n\nError:\n${error}`,
      },
    ];

    return this.chatCompletion(messages, options);
  }

  /**
   * Check rate limits
   */
  async checkRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastResetTime;

    // Reset counter every minute
    if (elapsed >= 60000) {
      this.requestsThisMinute = 0;
      this.lastResetTime = now;
    }

    // Check if at limit
    if (this.requestsThisMinute >= this.requestsPerMinute) {
      const waitTime = 60000 - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestsThisMinute = 0;
      this.lastResetTime = Date.now();
    }

    this.requestsThisMinute++;
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      totalRequests: this.totalRequests,
      totalTokens: this.totalTokens,
      requestsThisMinute: this.requestsThisMinute,
      rateLimit: this.requestsPerMinute,
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        headers: {
          'X-Client-ID': this.clientId,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default JumpStudyAPI;
