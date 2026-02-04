'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import { Send, Loader2, Bot, User, Sparkles, Trash2, Copy, Check, Square, Volume2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isTyping?: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [displayedContent, setDisplayedContent] = useState('')
  const [isTypingEffect, setIsTypingEffect] = useState(false)
  const [shouldStop, setShouldStop] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, displayedContent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Typing effect function
  const typeText = useCallback((fullText: string, currentIndex: number = 0) => {
    if (shouldStop || currentIndex >= fullText.length) {
      setIsTypingEffect(false)
      // Update final message
      setMessages(prev => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: shouldStop ? fullText.slice(0, currentIndex) : fullText,
            isTyping: false
          }
        }
        return updated
      })
      setShouldStop(false)
      return
    }

    // Type 2-5 characters at a time for faster typing
    const charsToAdd = Math.min(Math.floor(Math.random() * 4) + 2, fullText.length - currentIndex)
    const newContent = fullText.slice(0, currentIndex + charsToAdd)
    setDisplayedContent(newContent)

    // Update message with current content
    setMessages(prev => {
      const updated = [...prev]
      const lastIdx = updated.length - 1
      if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
        updated[lastIdx] = { ...updated[lastIdx], content: newContent, isTyping: true }
      }
      return updated
    })

    // Schedule next character(s) - faster typing
    const delay = Math.random() * 15 + 10 // 10-25ms per batch
    typingTimeoutRef.current = setTimeout(() => {
      typeText(fullText, currentIndex + charsToAdd)
    }, delay)
  }, [shouldStop])

  const stopGeneration = () => {
    setShouldStop(true)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsLoading(false)
    setIsTypingEffect(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setShouldStop(false)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
        signal: abortControllerRef.current.signal,
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Add empty assistant message that will be filled by typing effect
      setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }])
      setDisplayedContent('')
      setIsTypingEffect(true)
      setIsLoading(false)

      // Start typing effect
      typeText(data.message, 0)

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled
        console.log('Request cancelled')
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
          },
        ])
      }
      setIsLoading(false)
      setIsTypingEffect(false)
    } finally {
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const copyMessage = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const speakMessage = (content: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(content)
      speechSynthesis.speak(utterance)
    }
  }

  const clearChat = () => {
    setMessages([])
    setDisplayedContent('')
  }

  const isGenerating = isLoading || isTypingEffect

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white">AI Chat</h1>
              <p className="text-xs text-gray-500">Free & Unlimited</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isGenerating && (
              <button
                onClick={stopGeneration}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop
              </button>
            )}
            {messages.length > 0 && !isGenerating && (
              <button
                onClick={clearChat}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to JumpStudy AI Chat</h2>
              <p className="text-gray-400 max-w-md mb-8">
                Ask me anything! I can help with writing, coding, learning, creative projects, and more.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Write an essay about climate change',
                  'Explain quantum computing',
                  'Help me with Python code',
                  'Create a study plan',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} message-fade-in`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`relative group max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {message.content}
                    {message.isTyping && (
                      <span className="inline-block w-2 h-5 bg-purple-400 ml-1 animate-pulse" />
                    )}
                  </div>
                  {!message.isTyping && message.content && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => speakMessage(message.content)}
                        className={`p-1.5 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-purple-700 hover:bg-purple-800'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title="Read aloud"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => copyMessage(message.content, index)}
                        className={`p-1.5 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-purple-700 hover:bg-purple-800'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title="Copy"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && !isTypingEffect && (
            <div className="flex gap-3 message-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              disabled={isGenerating}
              className="w-full px-4 py-3 pr-14 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50"
              style={{ minHeight: '52px', maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-2">
            JumpStudy AI Chat is 100% free with unlimited messages
          </p>
        </div>
      </main>
    </div>
  )
}
