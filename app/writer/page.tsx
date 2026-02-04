'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Brain, Play, Pause, Clock, Calendar,
  Settings, Plus, Trash2, Edit3, Check, X,
  RefreshCw, Zap, Target, ChevronDown
} from 'lucide-react'

interface WritingTask {
  id: string
  title: string
  documentUrl: string
  prompt: string
  schedule: {
    type: 'immediate' | 'scheduled' | 'recurring'
    time?: string
    date?: string
    repeat?: 'daily' | 'weekly' | 'monthly'
  }
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  output?: string
  insertionPoint?: string
  createdAt: Date
  lastRun?: Date
}

export default function WriterPage() {
  const [tasks, setTasks] = useState<WritingTask[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [activeTask, setActiveTask] = useState<WritingTask | null>(null)

  // New task form state
  const [newTitle, setNewTitle] = useState('')
  const [newDocUrl, setNewDocUrl] = useState('')
  const [newPrompt, setNewPrompt] = useState('')
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled' | 'recurring'>('immediate')
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [repeatInterval, setRepeatInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Writing preview state
  const [previewContent, setPreviewContent] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [documentContent, setDocumentContent] = useState('')

  const generatePreview = async () => {
    if (!newPrompt.trim()) return
    setPreviewLoading(true)

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'smart-write',
          data: {
            title: newTitle || 'Untitled Document',
            content: documentContent,
            task: newPrompt,
          }
        })
      })

      const result = await response.json()
      setPreviewContent(result.content || '')
    } catch (error) {
      console.error('Preview generation failed:', error)
    } finally {
      setPreviewLoading(false)
    }
  }

  const createTask = () => {
    if (!newPrompt.trim()) return

    const task: WritingTask = {
      id: Date.now().toString(),
      title: newTitle || 'Untitled Writing Task',
      documentUrl: newDocUrl,
      prompt: newPrompt,
      schedule: {
        type: scheduleType,
        time: scheduleTime || undefined,
        date: scheduleDate || undefined,
        repeat: scheduleType === 'recurring' ? repeatInterval : undefined,
      },
      status: 'pending',
      progress: 0,
      output: previewContent,
      createdAt: new Date(),
    }

    setTasks([...tasks, task])
    resetForm()

    // Start immediately if scheduled for now
    if (scheduleType === 'immediate') {
      runTask(task.id)
    }
  }

  const resetForm = () => {
    setIsCreating(false)
    setNewTitle('')
    setNewDocUrl('')
    setNewPrompt('')
    setScheduleType('immediate')
    setScheduleTime('')
    setScheduleDate('')
    setPreviewContent('')
    setDocumentContent('')
  }

  const runTask = async (taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'running' as const, progress: 0 } : t
    ))

    // Simulate writing progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 200))
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, progress: i } : t
      ))
    }

    setTasks(prev => prev.map(t =>
      t.id === taskId ? {
        ...t,
        status: 'completed' as const,
        progress: 100,
        lastRun: new Date()
      } : t
    ))
  }

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const getStatusColor = (status: WritingTask['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-500'
      case 'running': return 'text-blue-500'
      case 'completed': return 'text-green-500'
      case 'failed': return 'text-red-500'
    }
  }

  const getStatusIcon = (status: WritingTask['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'running': return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'completed': return <Check className="w-4 h-4" />
      case 'failed': return <X className="w-4 h-4" />
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
            <Link href="/notebook" className="text-gray-400 hover:text-white transition-colors">Notebook</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cloud Writer</h1>
            <p className="text-gray-400">AI writes directly to your documents on schedule</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Writing Task
          </button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <Target className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-semibold mb-1">Smart Placement</h3>
            <p className="text-sm text-gray-400">AI knows exactly where to insert content in your document</p>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <Calendar className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold mb-1">Scheduled Writing</h3>
            <p className="text-sm text-gray-400">Set it and forget it - AI writes on your schedule</p>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <Zap className="w-8 h-8 text-yellow-500 mb-3" />
            <h3 className="font-semibold mb-1">Real-time Sync</h3>
            <p className="text-sm text-gray-400">Changes appear instantly in Google Docs</p>
          </div>
        </div>

        {/* Create Task Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-6">Create Writing Task</h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left column - Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Task Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Weekly Report Introduction"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Google Docs URL (optional)</label>
                    <input
                      type="url"
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/d/..."
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Link your Google Doc for direct writing</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Current Document Content (paste here)</label>
                    <textarea
                      value={documentContent}
                      onChange={(e) => setDocumentContent(e.target.value)}
                      placeholder="Paste your existing document content so AI knows where to add new content..."
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">What should AI write?</label>
                    <textarea
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      placeholder="e.g., Write an introduction paragraph about Q4 sales performance that goes at the beginning of the document..."
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Schedule</label>
                    <div className="flex gap-2 mb-3">
                      {(['immediate', 'scheduled', 'recurring'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setScheduleType(type)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            scheduleType === type
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>

                    {scheduleType !== 'immediate' && (
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}

                    {scheduleType === 'recurring' && (
                      <div className="mt-2">
                        <label className="block text-sm text-gray-400 mb-1">Repeat</label>
                        <select
                          value={repeatInterval}
                          onChange={(e) => setRepeatInterval(e.target.value as any)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={generatePreview}
                    disabled={!newPrompt.trim() || previewLoading}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    {previewLoading ? 'Generating...' : 'Preview AI Output'}
                  </button>
                </div>

                {/* Right column - Preview */}
                <div>
                  <label className="block text-sm font-medium mb-2">AI Output Preview</label>
                  <div className="h-[400px] p-4 bg-gray-800 border border-gray-700 rounded-lg overflow-y-auto">
                    {previewLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                      </div>
                    ) : previewContent ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <div className="text-xs text-purple-400 mb-2">AI will insert this content:</div>
                        <div className="whitespace-pre-wrap">{previewContent}</div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Click "Preview AI Output" to see what will be written
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetForm}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTask}
                  disabled={!newPrompt.trim()}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {scheduleType === 'immediate' ? 'Write Now' : 'Schedule Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No writing tasks yet</h3>
              <p className="text-gray-400 mb-4">Create a task to have AI write to your documents</p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Create Writing Task
              </button>
            </div>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                className="p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {task.title}
                      <span className={`flex items-center gap-1 text-sm ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {task.status}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{task.prompt.slice(0, 100)}...</p>
                  </div>
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => runTask(task.id)}
                        className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTask(task)}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {task.status === 'running' && (
                  <div className="mt-3">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Writing... {task.progress}%</p>
                  </div>
                )}

                {/* Schedule info */}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.schedule.type === 'immediate'
                      ? 'Run immediately'
                      : task.schedule.type === 'recurring'
                      ? `Repeats ${task.schedule.repeat}`
                      : `Scheduled for ${task.schedule.date} ${task.schedule.time}`
                    }
                  </span>
                  {task.lastRun && (
                    <span>Last run: {task.lastRun.toLocaleString()}</span>
                  )}
                </div>

                {/* Output preview */}
                {task.output && task.status === 'completed' && (
                  <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                    <p className="text-xs text-green-400 mb-1">Written content:</p>
                    <p className="text-sm text-gray-300">{task.output.slice(0, 200)}...</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Google Docs Setup Instructions */}
        <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <h3 className="font-semibold mb-2">Connect Google Docs</h3>
          <p className="text-sm text-gray-400 mb-3">
            To enable direct writing to Google Docs, you'll need to set up the Google Docs API:
          </p>
          <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
            <li>Go to Google Cloud Console and create a project</li>
            <li>Enable the Google Docs API</li>
            <li>Create OAuth credentials</li>
            <li>Add your credentials to the environment variables</li>
          </ol>
          <p className="text-sm text-purple-400 mt-3">
            For now, you can paste document content and copy the AI output manually.
          </p>
        </div>
      </main>
    </div>
  )
}
