'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import {
  Send, Paperclip, Plus, MessageSquare, Sparkles, Settings,
  Search, Brain, Wand2, GraduationCap, FileText, Trophy,
  Globe, Upload, Calendar, Mic, CircleDot
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@/lib/supabase/client';

interface ChatInterfaceProps {
  userId: string;
  initialCredits: number;
}

export default function ChatInterface({ userId, initialCredits }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [creditsBalance, setCreditsBalance] = useState(initialCredits);
  const [showRightPanel, setShowRightPanel] = useState('ai-detect');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    body: { conversationId: currentConversationId },
  });

  const supabase = createClient();

  const suggestions = [
    { icon: FileText, title: 'Write Essay', subtitle: 'Auto-humanized', color: 'from-yellow-500 to-orange-500' },
    { icon: Trophy, title: 'Create Quiz', subtitle: 'Interactive', color: 'from-purple-500 to-pink-500' },
    { icon: Brain, title: 'Flashcards', subtitle: 'Study cards', color: 'from-orange-500 to-red-500' },
    { icon: Wand2, title: 'Humanize', subtitle: 'Remove AI tone', color: 'from-orange-500 to-red-500' },
    { icon: CircleDot, title: 'Detect AI', subtitle: 'Check content', color: 'from-gray-500 to-gray-600' },
    { icon: Trophy, title: 'Build Game', subtitle: 'Educational', color: 'from-red-500 to-orange-500' },
    { icon: Globe, title: 'Web Search', subtitle: 'Current info', color: 'from-blue-500 to-purple-500' },
    { icon: Upload, title: 'Upload File', subtitle: 'PDF, Image, Text', color: 'from-green-500 to-emerald-500' },
  ];

  async function createNewConversation() {
    const { data } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: 'New Conversation' })
      .select()
      .single();

    if (data) {
      setCurrentConversationId(data.id);
      setMessages([]);
      loadConversations();
    }
  }

  async function loadConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (data) setConversations(data);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left Sidebar */}
      <div className="w-64 bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Jumpstudy
          </h1>
        </div>

        {/* New Chat Button */}
        <div className="px-4">
          <button
            onClick={createNewConversation}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto mt-6 px-4">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">No chat history</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setCurrentConversationId(conv.id)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors mb-2 text-sm"
              >
                {conv.title || 'Untitled'}
              </button>
            ))
          )}
        </div>

        {/* Usage */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Usage</span>
            <span>{creditsBalance.toFixed(0)} / 500,000</span>
          </div>
        </div>

        {/* Bottom Icons */}
        <div className="p-4 flex items-center justify-around border-t border-gray-800">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <CircleDot className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <span className="font-semibold">
              <span className="text-orange-500">JumpGPT</span>
              <span className="text-gray-400 text-sm ml-2">Free & Unlimited</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6">
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    Jumpstudy
                  </h2>
                </div>
                <h3 className="text-3xl font-bold mb-4">What can I help you with?</h3>
                <p className="text-gray-400 mb-2">
                  I can do everything ChatGPT can - for free and unlimited.
                </p>
                <p className="text-sm text-gray-500">
                  All responses are automatically humanized.
                </p>
                <p className="text-xs text-gray-600 mt-4">
                  Click the logo above to start talking, or try a suggestion below
                </p>
              </div>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-4 gap-4 max-w-4xl w-full">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="bg-gradient-to-br from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 border border-gray-700 rounded-xl p-6 transition-all group"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${suggestion.color} rounded-lg flex items-center justify-center mb-4 mx-auto`}>
                      <suggestion.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-1 text-white">{suggestion.title}</h4>
                    <p className="text-xs text-gray-400">{suggestion.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-8">
              {messages.map((message, idx) => (
                <div key={idx} className="mb-8">
                  <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-blue-500'
                        : 'bg-gradient-to-br from-orange-500 to-red-600'
                    }`}>
                      {message.role === 'user' ? '👤' : <Sparkles className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Toolbar & Input */}
        <div className="border-t border-gray-800">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-800">
            <button className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm">
              <Search className="w-4 h-4" />
              Search
            </button>
            <button className="px-4 py-2 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 transition-colors flex items-center gap-2 text-sm border border-purple-700">
              <Brain className="w-4 h-4" />
              Memory
            </button>
            <button className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm">
              <Wand2 className="w-4 h-4" />
              Auto-Humanize
            </button>
            <button className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm">
              <GraduationCap className="w-4 h-4" />
              Tutor Mode
            </button>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center gap-3 bg-gray-900 rounded-2xl border border-gray-700 px-4 py-3">
              <button type="button" className="text-gray-400 hover:text-white transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Message JumpGPT..."
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl p-3 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-xs text-gray-600 mt-2">
              Enter to send
            </p>
          </form>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-96 bg-gradient-to-b from-gray-900 to-black border-l border-gray-800">
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setShowRightPanel('ai-detect')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              showRightPanel === 'ai-detect'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            AI Detect
          </button>
          <button
            onClick={() => setShowRightPanel('schedule')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              showRightPanel === 'schedule'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Schedule
          </button>
        </div>

        <div className="p-6">
          {showRightPanel === 'ai-detect' ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button className="flex-1 bg-red-900/30 border border-red-700 rounded-lg py-2 px-3 text-sm flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Calendar
                </button>
                <button className="flex-1 bg-purple-900/30 border border-purple-700 rounded-lg py-2 px-3 text-sm flex items-center justify-center gap-2">
                  <Mic className="w-4 h-4" />
                  Record
                </button>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Paste text to analyze</h4>
                <textarea
                  className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm resize-none"
                  placeholder="Paste at least 50 characters..."
                />
                <p className="text-xs text-gray-500 mt-1">0 characters</p>
              </div>

              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg py-3 font-semibold transition-all">
                Detect AI
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Schedule coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
