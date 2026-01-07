'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { SendHorizonal, Image as ImageIcon, Paperclip, Plus, MessageSquare, Sparkles, Coins, Mic, GraduationCap, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@/lib/supabase/client';
import { ChatCreditsEstimator, UsageIndicator } from './credits-display';
import { estimateMessageCost } from '@/lib/credits-system';
import AudioRecorder from './audio-recorder';

interface EnhancedChatInterfaceProps {
  userId: string;
  initialCredits: number;
}

export default function EnhancedChatInterface({
  userId,
  initialCredits,
}: EnhancedChatInterfaceProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState(initialCredits);
  const [lastMessageCredits, setLastMessageCredits] = useState<number | null>(null);
  const [showConversationMode, setShowConversationMode] = useState(false);
  const [tutorMode, setTutorMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    body: {
      conversationId: currentConversationId,
    },
    onFinish: (message) => {
      // Refresh credits balance after message
      refreshCreditsBalance();
    },
  });

  const supabase = createClient();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  async function refreshCreditsBalance() {
    const { data } = await supabase
      .from('users')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    if (data) {
      setCreditsBalance(data.credits_balance);
    }
  }

  async function loadConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (data) {
      setConversations(data);
    }
  }

  async function createNewConversation() {
    const { data } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: 'New Conversation',
      })
      .select()
      .single();

    if (data) {
      setCurrentConversationId(data.id);
      setMessages([]);
      await loadConversations();
    }
  }

  async function loadConversation(conversationId: string) {
    setCurrentConversationId(conversationId);

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(
        data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }))
      );
    }
  }

  async function generateImage() {
    if (!imagePrompt.trim() || creditsBalance < 150) return;

    setIsGeneratingImage(true);

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      const data = await response.json();

      if (data.imageUrl) {
        setGeneratedImages([...generatedImages, data.imageUrl]);
        setImagePrompt('');
        setShowImagePrompt(false);

        // Update credits balance
        if (data.newBalance !== undefined) {
          setCreditsBalance(data.newBalance);
        }
      } else {
        alert(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileMessage = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: `[Uploaded: ${file.name}]\n\n${content}`,
      };
      setMessages([...messages, fileMessage]);
    };
    reader.readAsText(file);
  }

  async function handleRecordingComplete(audioBlob: Blob, transcript?: string) {
    if (transcript) {
      // Add transcript to chat as a user message
      await append({
        role: 'user',
        content: `[Voice Recording]\n\n${transcript}`,
      });

      // Close conversation mode after sending
      setShowConversationMode(false);
    }
  }

  function handleScheduleDetected(scheduleInfo: any) {
    // Schedule info is already saved by the API
    console.log('Lecture detected and saved:', scheduleInfo);
  }

  const estimate = estimateMessageCost(input);
  const canAfford = creditsBalance >= estimate.estimatedCredits;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header with Credits */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Conversations</h2>
            <button
              onClick={createNewConversation}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Credits Display */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-yellow-900 mb-1">
                  Credits Balance
                </div>
                <div className="text-2xl font-bold text-yellow-700">
                  {creditsBalance.toFixed(1)}
                </div>
              </div>
            </div>

            {creditsBalance < 100 && (
              <a
                href="/credits"
                className="block mt-3 text-center bg-yellow-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-yellow-700 transition-colors"
              >
                Buy More Credits
              </a>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentConversationId === conv.id
                  ? 'bg-blue-50 border-2 border-blue-600'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-1 text-gray-500" />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm line-clamp-1">
                    {conv.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {conversations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <button
                onClick={createNewConversation}
                className="mt-4 text-blue-600 text-sm font-semibold hover:text-blue-700"
              >
                Start your first chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${messages.length === 0 ? 'items-center justify-center' : ''}`}>
        {/* Chat Header - ChatGPT Style - Only show when there are messages */}
        {messages.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">JumpStudy AI</h1>
              <p className="text-xs text-gray-500">
                {tutorMode ? '🎓 Tutor Mode Active' : 'I have no limits'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTutorMode(!tutorMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                tutorMode
                  ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-2 border-orange-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Tutor Mode
            </button>
            <button
              onClick={() => setShowConversationMode(!showConversationMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                showConversationMode
                  ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mic className="w-4 h-4" />
              Conversation
            </button>
            <button
              onClick={() => setShowImagePrompt(!showImagePrompt)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <ImageIcon className="w-4 h-4" />
              Image
            </button>
          </div>
        </div>
        )}

        {/* Centered Welcome Screen with Input - Only show when no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full max-w-3xl px-6 space-y-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-11 h-11 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
                How can I help you today?
              </h1>
              <p className="text-gray-500 text-center text-lg">
                {tutorMode
                  ? 'I\'m in Tutor Mode - I\'ll guide you step-by-step through any topic.'
                  : 'Ask me anything to get started'}
              </p>
            </div>

            {/* Centered Input Box */}
            <div className="w-full max-w-2xl">
              {/* Credits Estimator */}
              {input.trim() && (
                <div className="mb-3">
                  <ChatCreditsEstimator inputText={input} />
                </div>
              )}

              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx"
                />

                <div className="relative flex items-end gap-2 bg-white border-2 border-gray-300 rounded-3xl shadow-lg hover:border-gray-400 focus-within:border-orange-500 transition-colors">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors ml-2 mb-2"
                  >
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  </button>

                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder={
                      canAfford
                        ? tutorMode
                          ? 'Ask me to explain anything step-by-step...'
                          : 'Message JumpStudy AI...'
                        : 'Insufficient credits - please buy more'
                    }
                    disabled={!canAfford || isLoading}
                    className="flex-1 px-2 py-4 focus:outline-none resize-none max-h-48 disabled:cursor-not-allowed bg-transparent text-base"
                    rows={1}
                    style={{ minHeight: '24px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (canAfford && !isLoading && input.trim()) {
                          handleSubmit(e as any);
                        }
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '24px';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !input.trim() || !canAfford}
                    className="p-3 mr-2 mb-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all"
                  >
                    <SendHorizonal className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {!canAfford && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-sm">
                  <p className="text-red-700">
                    You need at least {estimate.estimatedCredits.toFixed(1)} credits to send this
                    message.
                  </p>
                  <a
                    href="/credits"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Buy Credits
                  </a>
                </div>
              )}

              <p className="text-xs text-center text-gray-400 mt-3">
                JumpStudy AI can make mistakes. Check important info.
              </p>
            </div>
          </div>
        )}

        {/* Messages - ChatGPT Style */}
        <div className={`flex-1 overflow-y-auto ${messages.length === 0 ? 'hidden' : ''}`}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`group px-6 py-6 ${
                message.role === 'user' ? 'bg-white' : 'bg-gray-50'
              } border-b border-gray-100`}
            >
              <div className="max-w-3xl mx-auto flex gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 mb-2">
                    {message.role === 'user' ? 'You' : 'JumpStudy AI'}
                  </div>
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-gray-100">
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="px-6 py-6 bg-gray-50 border-b border-gray-100">
              <div className="max-w-3xl mx-auto flex gap-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {generatedImages.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Generated ${idx + 1}`}
                  className="rounded-lg shadow-lg"
                />
              ))}
            </div>
          )}
        </div>

        {/* Image Generation Prompt - Only show when there are messages */}
        {showImagePrompt && messages.length > 0 && (
          <div className="px-6 py-4 bg-purple-50 border-t border-purple-200">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="flex-1 rounded-full border border-purple-300 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  onKeyDown={(e) => e.key === 'Enter' && generateImage()}
                />
                <button
                  onClick={generateImage}
                  disabled={isGeneratingImage || !imagePrompt.trim() || creditsBalance < 150}
                  className="bg-purple-600 text-white rounded-full px-6 py-3 hover:bg-purple-700 disabled:bg-gray-300 transition-colors font-semibold"
                >
                  {isGeneratingImage ? 'Generating...' : 'Generate'}
                </button>
              </div>
              {creditsBalance < 150 && (
                <p className="text-red-600 text-sm mt-2">
                  Insufficient credits. You need 150 credits to generate an image.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Conversation Mode (Audio Recorder) - Only show when there are messages */}
        {showConversationMode && messages.length > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
            <div className="max-w-3xl mx-auto">
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                onScheduleDetected={handleScheduleDetected}
              />
            </div>
          </div>
        )}

        {/* Input Area - ChatGPT Style - Only show when there are messages */}
        {messages.length > 0 && (
        <div className="bg-white px-6 py-6 border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            {/* Credits Estimator */}
            {input.trim() && (
              <div className="mb-3">
                <ChatCreditsEstimator inputText={input} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".txt,.pdf,.doc,.docx"
              />

              <div className="relative flex items-end gap-2 bg-white border border-gray-300 rounded-3xl shadow-sm hover:border-gray-400 focus-within:border-orange-500 transition-colors">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors ml-2 mb-2"
                >
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </button>

                <textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder={
                    canAfford
                      ? tutorMode
                        ? 'Ask me to explain anything step-by-step...'
                        : 'Message JumpStudy AI...'
                      : 'Insufficient credits - please buy more'
                  }
                  disabled={!canAfford || isLoading}
                  className="flex-1 px-2 py-4 focus:outline-none resize-none max-h-48 disabled:cursor-not-allowed bg-transparent"
                  rows={1}
                  style={{ minHeight: '24px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (canAfford && !isLoading && input.trim()) {
                        handleSubmit(e as any);
                      }
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '24px';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />

                <button
                  type="submit"
                  disabled={isLoading || !input.trim() || !canAfford}
                  className="p-3 mr-2 mb-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all"
                >
                  <SendHorizonal className="w-5 h-5" />
                </button>
              </div>
            </form>

            {!canAfford && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-sm">
                <p className="text-red-700">
                  You need at least {estimate.estimatedCredits.toFixed(1)} credits to send this
                  message.
                </p>
                <a
                  href="/credits"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Buy Credits
                </a>
              </div>
            )}

            <p className="text-xs text-center text-gray-400 mt-3">
              JumpStudy AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
