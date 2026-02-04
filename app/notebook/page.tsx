'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Brain, FileText, Upload, Mic, Play, Pause, Download,
  MessageSquare, Sparkles, Trash2, Plus, ChevronRight,
  BookOpen, List, HelpCircle, Volume2, StopCircle
} from 'lucide-react'

interface Document {
  id: string
  name: string
  content: string
  type: 'pdf' | 'text' | 'url'
  uploadedAt: Date
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function NotebookPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [summary, setSummary] = useState('')
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [questions, setQuestions] = useState<string[]>([])
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    try {
      // Read file content
      const content = await file.text()

      const doc: Document = {
        id: Date.now().toString(),
        name: file.name,
        content: content.slice(0, 50000), // Limit content size
        type: file.name.endsWith('.pdf') ? 'pdf' : 'text',
        uploadedAt: new Date(),
      }

      setDocuments(prev => [...prev, doc])
      setSelectedDoc(doc)

      // Auto-analyze document
      await analyzeDocument(doc)
    } catch (error) {
      console.error('File upload error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUrlImport = async () => {
    const url = prompt('Enter URL to import:')
    if (!url) return

    setIsProcessing(true)

    try {
      // For now, create a placeholder - would need server-side fetch
      const doc: Document = {
        id: Date.now().toString(),
        name: new URL(url).hostname,
        content: `Content from: ${url}\n\n(URL content would be fetched server-side)`,
        type: 'url',
        uploadedAt: new Date(),
      }

      setDocuments(prev => [...prev, doc])
      setSelectedDoc(doc)
    } catch (error) {
      console.error('URL import error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextPaste = () => {
    const text = prompt('Paste your text content:')
    if (!text) return

    const doc: Document = {
      id: Date.now().toString(),
      name: 'Pasted Text',
      content: text,
      type: 'text',
      uploadedAt: new Date(),
    }

    setDocuments(prev => [...prev, doc])
    setSelectedDoc(doc)
    analyzeDocument(doc)
  }

  const analyzeDocument = async (doc: Document) => {
    setIsProcessing(true)
    setSummary('')
    setKeyPoints([])
    setQuestions([])

    try {
      // Generate summary
      const summaryResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Summarize this document in 2-3 paragraphs:\n\n${doc.content.slice(0, 10000)}`
          }]
        })
      })
      const summaryData = await summaryResponse.json()
      setSummary(summaryData.message || '')

      // Generate key points
      const pointsResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `List 5-7 key points from this document as a simple list (one per line, no numbers or bullets):\n\n${doc.content.slice(0, 10000)}`
          }]
        })
      })
      const pointsData = await pointsResponse.json()
      const points = (pointsData.message || '').split('\n').filter((p: string) => p.trim()).slice(0, 7)
      setKeyPoints(points)

      // Generate questions
      const questionsResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate 5 discussion questions based on this document (one per line, just the questions):\n\n${doc.content.slice(0, 10000)}`
          }]
        })
      })
      const questionsData = await questionsResponse.json()
      const qs = (questionsData.message || '').split('\n').filter((q: string) => q.trim() && q.includes('?')).slice(0, 5)
      setQuestions(qs)

    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || !selectedDoc) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `You are analyzing this document. Answer questions based on it:\n\n${selectedDoc.content.slice(0, 15000)}` },
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ]
        })
      })

      const data = await response.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.message || 'Unable to answer.' }])
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error processing your question.' }])
    }
  }

  const generateAudioOverview = async () => {
    if (!selectedDoc || !summary) return

    setIsGeneratingAudio(true)

    // Use Web Speech API to create audio
    if ('speechSynthesis' in window) {
      const text = `Here's an audio overview of ${selectedDoc.name}. ${summary}. Key points include: ${keyPoints.join('. ')}.`

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1

      utterance.onend = () => {
        setIsPlayingAudio(false)
        setIsGeneratingAudio(false)
      }

      setIsGeneratingAudio(false)
      setIsPlayingAudio(true)
      speechSynthesis.speak(utterance)
    }
  }

  const stopAudio = () => {
    speechSynthesis.cancel()
    setIsPlayingAudio(false)
  }

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
    if (selectedDoc?.id === id) {
      setSelectedDoc(null)
      setSummary('')
      setKeyPoints([])
      setQuestions([])
      setChatMessages([])
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold">JumpStudy AI</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/chat" className="text-gray-400 hover:text-white transition-colors">Chat</Link>
            <Link href="/study" className="text-gray-400 hover:text-white transition-colors">Study</Link>
            <Link href="/writer" className="text-gray-400 hover:text-white transition-colors">Writer</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">AI Notebook</h1>
            <p className="text-gray-400">Upload documents and let AI analyze, summarize, and answer questions</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Documents Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <h3 className="font-semibold mb-3">Sources</h3>

              {/* Upload options */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.md,.doc,.docx"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-1"
                >
                  <Upload className="w-5 h-5 text-purple-400" />
                  <span className="text-xs">Upload</span>
                </button>
                <button
                  onClick={handleUrlImport}
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-1"
                >
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-xs">URL</span>
                </button>
                <button
                  onClick={handleTextPaste}
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-1"
                >
                  <Plus className="w-5 h-5 text-green-400" />
                  <span className="text-xs">Paste</span>
                </button>
              </div>

              {/* Document list */}
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No documents yet</p>
                ) : (
                  documents.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => { setSelectedDoc(doc); analyzeDocument(doc); }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                        selectedDoc?.id === doc.id
                          ? 'bg-purple-600/20 border border-purple-500'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm truncate">{doc.name}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Audio Overview */}
            {selectedDoc && summary && (
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-purple-400" />
                  Audio Overview
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Listen to an AI-generated audio summary of your document
                </p>
                {isPlayingAudio ? (
                  <button
                    onClick={stopAudio}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <StopCircle className="w-5 h-5" />
                    Stop Audio
                  </button>
                ) : (
                  <button
                    onClick={generateAudioOverview}
                    disabled={isGeneratingAudio}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isGeneratingAudio ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Generate Audio
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedDoc ? (
              <div className="p-12 bg-gray-900 border border-gray-800 rounded-xl text-center">
                <BookOpen className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload a document to get started</h3>
                <p className="text-gray-400">
                  AI will analyze, summarize, and let you ask questions about your content
                </p>
              </div>
            ) : (
              <>
                {/* Document Header */}
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <h2 className="text-xl font-semibold mb-2">{selectedDoc.name}</h2>
                  <p className="text-sm text-gray-400">
                    Uploaded {selectedDoc.uploadedAt.toLocaleDateString()} • {selectedDoc.content.split(/\s+/).length} words
                  </p>
                </div>

                {/* Analysis Results */}
                {isProcessing ? (
                  <div className="p-8 bg-gray-900 border border-gray-800 rounded-xl text-center">
                    <div className="w-12 h-12 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400">Analyzing document...</p>
                  </div>
                ) : (
                  <>
                    {/* Summary */}
                    {summary && (
                      <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                          Summary
                        </h3>
                        <p className="text-gray-300 leading-relaxed">{summary}</p>
                      </div>
                    )}

                    {/* Key Points */}
                    {keyPoints.length > 0 && (
                      <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <List className="w-5 h-5 text-blue-400" />
                          Key Points
                        </h3>
                        <ul className="space-y-2">
                          {keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                              <span className="text-gray-300">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Discussion Questions */}
                    {questions.length > 0 && (
                      <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-green-400" />
                          Discussion Questions
                        </h3>
                        <ul className="space-y-2">
                          {questions.map((q, i) => (
                            <li
                              key={i}
                              onClick={() => setChatInput(q)}
                              className="p-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors text-sm text-gray-300"
                            >
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Chat */}
                    <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        Ask About This Document
                      </h3>

                      {/* Chat messages */}
                      <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-purple-600/20 ml-8'
                                : 'bg-gray-800 mr-8'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        ))}
                      </div>

                      {/* Chat input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                          placeholder="Ask a question about this document..."
                          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={sendChat}
                          disabled={!chatInput.trim()}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
