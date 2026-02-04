'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, Brain, FileText, Zap, Plus, Play,
  RotateCcw, CheckCircle, XCircle, Shuffle, Clock,
  Download, Share2, Trash2, Edit3, Volume2
} from 'lucide-react'

interface Flashcard {
  id: string
  term: string
  definition: string
  learned: boolean
}

interface StudySet {
  id: string
  title: string
  description: string
  cards: Flashcard[]
  createdAt: Date
}

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'learn' | 'test' | 'match'>('flashcards')
  const [studySets, setStudySets] = useState<StudySet[]>([])
  const [currentSet, setCurrentSet] = useState<StudySet | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newSetTitle, setNewSetTitle] = useState('')
  const [newSetDescription, setNewSetDescription] = useState('')
  const [newCards, setNewCards] = useState<{ term: string; definition: string }[]>([
    { term: '', definition: '' }
  ])
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiTopic, setAiTopic] = useState('')

  // Test mode state
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({})
  const [testSubmitted, setTestSubmitted] = useState(false)
  const [testScore, setTestScore] = useState(0)

  // Match game state
  const [matchCards, setMatchCards] = useState<{ id: string; text: string; type: 'term' | 'definition'; matched: boolean; selected: boolean }[]>([])
  const [matchSelected, setMatchSelected] = useState<string | null>(null)
  const [matchScore, setMatchScore] = useState(0)
  const [matchTime, setMatchTime] = useState(0)
  const [matchStarted, setMatchStarted] = useState(false)

  const generateFlashcardsWithAI = async () => {
    if (!aiTopic.trim()) return
    setAiGenerating(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Create 10 flashcards for studying "${aiTopic}". Return ONLY a JSON array with objects containing "term" and "definition" fields. No explanations, just the JSON array. Example format: [{"term": "Term 1", "definition": "Definition 1"}]`
          }]
        })
      })

      const data = await response.json()
      const message = data.message || ''

      // Extract JSON from response
      const jsonMatch = message.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const cards = JSON.parse(jsonMatch[0])
        setNewCards(cards.map((c: any) => ({ term: c.term || '', definition: c.definition || '' })))
        setNewSetTitle(`${aiTopic} Study Set`)
        setNewSetDescription(`AI-generated flashcards for ${aiTopic}`)
      }
    } catch (error) {
      console.error('Failed to generate flashcards:', error)
    } finally {
      setAiGenerating(false)
    }
  }

  const createStudySet = () => {
    if (!newSetTitle.trim() || newCards.filter(c => c.term && c.definition).length === 0) return

    const newSet: StudySet = {
      id: Date.now().toString(),
      title: newSetTitle,
      description: newSetDescription,
      cards: newCards
        .filter(c => c.term && c.definition)
        .map((c, i) => ({
          id: `${Date.now()}-${i}`,
          term: c.term,
          definition: c.definition,
          learned: false
        })),
      createdAt: new Date()
    }

    setStudySets([...studySets, newSet])
    setIsCreating(false)
    setNewSetTitle('')
    setNewSetDescription('')
    setNewCards([{ term: '', definition: '' }])
    setCurrentSet(newSet)
  }

  const addCard = () => {
    setNewCards([...newCards, { term: '', definition: '' }])
  }

  const updateCard = (index: number, field: 'term' | 'definition', value: string) => {
    const updated = [...newCards]
    updated[index][field] = value
    setNewCards(updated)
  }

  const removeCard = (index: number) => {
    if (newCards.length > 1) {
      setNewCards(newCards.filter((_, i) => i !== index))
    }
  }

  const startLearnMode = () => {
    if (!currentSet) return
    setCurrentCardIndex(0)
    setShowAnswer(false)
    setActiveTab('learn')
  }

  const startTestMode = () => {
    if (!currentSet) return
    setTestAnswers({})
    setTestSubmitted(false)
    setTestScore(0)
    setActiveTab('test')
  }

  const startMatchGame = () => {
    if (!currentSet) return

    const cards: typeof matchCards = []
    currentSet.cards.slice(0, 6).forEach(card => {
      cards.push({ id: `t-${card.id}`, text: card.term, type: 'term', matched: false, selected: false })
      cards.push({ id: `d-${card.id}`, text: card.definition, type: 'definition', matched: false, selected: false })
    })

    // Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]]
    }

    setMatchCards(cards)
    setMatchSelected(null)
    setMatchScore(0)
    setMatchTime(0)
    setMatchStarted(true)
    setActiveTab('match')
  }

  const handleMatchClick = (id: string) => {
    const card = matchCards.find(c => c.id === id)
    if (!card || card.matched) return

    if (!matchSelected) {
      setMatchSelected(id)
      setMatchCards(matchCards.map(c => c.id === id ? { ...c, selected: true } : c))
    } else {
      const firstCard = matchCards.find(c => c.id === matchSelected)
      if (!firstCard) return

      // Check if match
      const firstBaseId = matchSelected.split('-')[1]
      const secondBaseId = id.split('-')[1]

      if (firstBaseId === secondBaseId && firstCard.type !== card.type) {
        // Match!
        setMatchCards(matchCards.map(c =>
          c.id === id || c.id === matchSelected
            ? { ...c, matched: true, selected: false }
            : c
        ))
        setMatchScore(matchScore + 1)
      } else {
        // No match
        setMatchCards(matchCards.map(c => ({ ...c, selected: false })))
      }
      setMatchSelected(null)
    }
  }

  const submitTest = () => {
    if (!currentSet) return
    let correct = 0
    currentSet.cards.forEach(card => {
      if (testAnswers[card.id]?.toLowerCase().trim() === card.definition.toLowerCase().trim()) {
        correct++
      }
    })
    setTestScore(correct)
    setTestSubmitted(true)
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      speechSynthesis.speak(utterance)
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
            <Link href="/notebook" className="text-gray-400 hover:text-white transition-colors">Notebook</Link>
            <Link href="/writer" className="text-gray-400 hover:text-white transition-colors">Writer</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Study Tools</h1>
            <p className="text-gray-400">Flashcards, quizzes, and study modes powered by AI</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Study Set
          </button>
        </div>

        {/* Create Study Set Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-4">Create Study Set</h2>

              {/* AI Generation */}
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Generate with AI
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Enter a topic (e.g., 'French Revolution')"
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={generateFlashcardsWithAI}
                    disabled={aiGenerating || !aiTopic.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {aiGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={newSetTitle}
                onChange={(e) => setNewSetTitle(e.target.value)}
                placeholder="Study set title"
                className="w-full px-4 py-2 mb-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
              />

              <textarea
                value={newSetDescription}
                onChange={(e) => setNewSetDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-2 mb-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                rows={2}
              />

              <div className="space-y-3 mb-4">
                {newCards.map((card, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={card.term}
                      onChange={(e) => updateCard(index, 'term', e.target.value)}
                      placeholder="Term"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      value={card.definition}
                      onChange={(e) => updateCard(index, 'definition', e.target.value)}
                      placeholder="Definition"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={() => removeCard(index)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addCard}
                className="w-full py-2 mb-4 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
              >
                + Add Card
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createStudySet}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Create Set
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Study Sets Grid */}
        {!currentSet && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studySets.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <BookOpen className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No study sets yet</h3>
                <p className="text-gray-400 mb-4">Create your first study set or generate one with AI</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Create Study Set
                </button>
              </div>
            ) : (
              studySets.map(set => (
                <div
                  key={set.id}
                  onClick={() => setCurrentSet(set)}
                  className="p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-purple-500 transition-colors cursor-pointer"
                >
                  <h3 className="font-semibold mb-1">{set.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{set.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{set.cards.length} cards</span>
                    <span className="text-gray-500">{set.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Current Study Set View */}
        {currentSet && (
          <div>
            <button
              onClick={() => { setCurrentSet(null); setActiveTab('flashcards') }}
              className="mb-4 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to study sets
            </button>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{currentSet.title}</h2>
                <p className="text-gray-400">{currentSet.cards.length} cards</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('flashcards')}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'flashcards' ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  Flashcards
                </button>
                <button
                  onClick={startLearnMode}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'learn' ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  Learn
                </button>
                <button
                  onClick={startTestMode}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'test' ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  Test
                </button>
                <button
                  onClick={startMatchGame}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'match' ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  Match
                </button>
              </div>
            </div>

            {/* Flashcards View */}
            {activeTab === 'flashcards' && (
              <div className="grid md:grid-cols-2 gap-4">
                {currentSet.cards.map(card => (
                  <div key={card.id} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold">{card.term}</span>
                      <button
                        onClick={() => speakText(card.term)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-400">{card.definition}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Learn Mode */}
            {activeTab === 'learn' && (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-4 text-gray-400">
                  Card {currentCardIndex + 1} of {currentSet.cards.length}
                </div>
                <div
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="min-h-[300px] p-8 bg-gray-900 border border-gray-800 rounded-xl cursor-pointer flex items-center justify-center text-center transition-all hover:border-purple-500"
                >
                  <div>
                    {!showAnswer ? (
                      <>
                        <p className="text-2xl font-semibold mb-4">{currentSet.cards[currentCardIndex].term}</p>
                        <p className="text-gray-500">Click to reveal answer</p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-400 mb-2">{currentSet.cards[currentCardIndex].term}</p>
                        <p className="text-xl">{currentSet.cards[currentCardIndex].definition}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={() => {
                      setCurrentCardIndex(Math.max(0, currentCardIndex - 1))
                      setShowAnswer(false)
                    }}
                    disabled={currentCardIndex === 0}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      setCurrentCardIndex(Math.min(currentSet.cards.length - 1, currentCardIndex + 1))
                      setShowAnswer(false)
                    }}
                    disabled={currentCardIndex === currentSet.cards.length - 1}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Test Mode */}
            {activeTab === 'test' && (
              <div className="max-w-2xl mx-auto">
                {!testSubmitted ? (
                  <>
                    <div className="space-y-4">
                      {currentSet.cards.map((card, index) => (
                        <div key={card.id} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                          <p className="font-semibold mb-2">{index + 1}. {card.term}</p>
                          <input
                            type="text"
                            value={testAnswers[card.id] || ''}
                            onChange={(e) => setTestAnswers({ ...testAnswers, [card.id]: e.target.value })}
                            placeholder="Your answer..."
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={submitTest}
                      className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                      Submit Test
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-4">
                      {Math.round((testScore / currentSet.cards.length) * 100)}%
                    </div>
                    <p className="text-xl text-gray-400 mb-6">
                      You got {testScore} out of {currentSet.cards.length} correct
                    </p>
                    <div className="space-y-3 text-left">
                      {currentSet.cards.map((card, index) => {
                        const isCorrect = testAnswers[card.id]?.toLowerCase().trim() === card.definition.toLowerCase().trim()
                        return (
                          <div key={card.id} className={`p-4 rounded-xl ${isCorrect ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
                            <div className="flex items-start gap-2">
                              {isCorrect ? <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                              <div>
                                <p className="font-semibold">{card.term}</p>
                                <p className="text-sm text-gray-400">Your answer: {testAnswers[card.id] || '(empty)'}</p>
                                {!isCorrect && <p className="text-sm text-green-400">Correct: {card.definition}</p>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <button
                      onClick={startTestMode}
                      className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                      Retake Test
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Match Game */}
            {activeTab === 'match' && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-4">
                  <span className="text-gray-400">Matches: {matchScore}/{matchCards.filter(c => c.type === 'term').length}</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {matchCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => handleMatchClick(card.id)}
                      disabled={card.matched}
                      className={`p-4 min-h-[80px] rounded-xl text-sm transition-all ${
                        card.matched
                          ? 'bg-green-900/50 border border-green-700 opacity-50'
                          : card.selected
                          ? 'bg-purple-600 border border-purple-500'
                          : 'bg-gray-800 border border-gray-700 hover:border-purple-500'
                      }`}
                    >
                      {card.text}
                    </button>
                  ))}
                </div>
                {matchScore === matchCards.filter(c => c.type === 'term').length && (
                  <div className="text-center mt-6">
                    <p className="text-2xl font-bold text-green-400 mb-4">Complete!</p>
                    <button
                      onClick={startMatchGame}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
