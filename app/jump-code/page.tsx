'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
}

export default function JumpCodePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvo, setCurrentConvo] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<'opus' | 'sonnet' | 'haiku'>('opus');
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConvo?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirect=/jump-code');
      return;
    }
    setUser(user);
  }

  function loadConversations() {
    const saved = localStorage.getItem('jumpcode-conversations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
    }
  }

  function saveConversations(convos: Conversation[]) {
    localStorage.setItem('jumpcode-conversations', JSON.stringify(convos));
    setConversations(convos);
  }

  function createNewChat() {
    const newConvo: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      model,
      createdAt: new Date(),
    };
    const updated = [newConvo, ...conversations];
    saveConversations(updated);
    setCurrentConvo(newConvo);
  }

  function deleteConversation(id: string) {
    const updated = conversations.filter(c => c.id !== id);
    saveConversations(updated);
    if (currentConvo?.id === id) {
      setCurrentConvo(updated[0] || null);
    }
  }

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    let convo = currentConvo;
    if (!convo) {
      convo = {
        id: crypto.randomUUID(),
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [],
        model,
        createdAt: new Date(),
      };
    }

    const updatedMessages = [...convo.messages, userMessage];
    const updatedConvo = { ...convo, messages: updatedMessages };
    setCurrentConvo(updatedConvo);
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/jump-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          model,
          system: `You are Jump Code, an advanced AI assistant powered by Claude. You are helpful, harmless, and honest. You can help with coding, writing, analysis, math, and any other tasks. Be concise but thorough.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantContent = data.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalConvo = {
        ...updatedConvo,
        messages: finalMessages,
        title: convo.messages.length === 0 ? input.slice(0, 30) + (input.length > 30 ? '...' : '') : convo.title,
      };

      setCurrentConvo(finalConvo);

      // Save to localStorage
      const existingIndex = conversations.findIndex(c => c.id === finalConvo.id);
      let updated;
      if (existingIndex >= 0) {
        updated = [...conversations];
        updated[existingIndex] = finalConvo;
      } else {
        updated = [finalConvo, ...conversations];
      }
      saveConversations(updated);

    } catch (error: any) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setCurrentConvo({
        ...updatedConvo,
        messages: [...updatedMessages, errorMessage],
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-[#171717] border-r border-[#2d2d2d] flex flex-col overflow-hidden`}>
        <div className="p-3">
          <button
            onClick={createNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2d2d2d] hover:bg-[#2d2d2d] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => setCurrentConvo(convo)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-1 ${
                currentConvo?.id === convo.id ? 'bg-[#2d2d2d]' : 'hover:bg-[#2d2d2d]/50'
              }`}
            >
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-sm truncate flex-1">{convo.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#2d2d2d]">
          <div className="text-xs text-gray-500 mb-2">Model</div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as any)}
            className="w-full bg-[#2d2d2d] border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
          >
            <option value="opus">Claude Opus (Most Capable)</option>
            <option value="sonnet">Claude Sonnet (Balanced)</option>
            <option value="haiku">Claude Haiku (Fast)</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-[#2d2d2d] flex items-center px-4 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[#2d2d2d] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center font-bold text-sm">
              JC
            </div>
            <span className="font-semibold">Jump Code</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
              {model}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {!currentConvo || currentConvo.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-6">
                <span className="text-3xl font-bold">JC</span>
              </div>
              <h1 className="text-2xl font-semibold mb-2">Welcome to Jump Code</h1>
              <p className="text-gray-400 max-w-md mb-8">
                Powered by Claude. Ask me anything - coding, writing, analysis, or just chat.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                {[
                  'Help me write a Python script',
                  'Explain quantum computing',
                  'Debug my React component',
                  'Write a business email',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="p-3 text-left text-sm bg-[#171717] hover:bg-[#2d2d2d] rounded-xl border border-[#2d2d2d] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 px-4">
              {currentConvo.messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-6 ${message.role === 'user' ? 'flex justify-end' : ''}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-blue-500'
                        : 'bg-gradient-to-br from-orange-500 to-red-500'
                    }`}>
                      {message.role === 'user' ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">JC</span>
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500'
                        : 'bg-[#2d2d2d]'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <span className="text-xs font-bold">JC</span>
                  </div>
                  <div className="bg-[#2d2d2d] rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#2d2d2d] p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Jump Code..."
                rows={1}
                className="w-full bg-[#2d2d2d] border border-[#3d3d3d] rounded-2xl px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Jump Code can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
