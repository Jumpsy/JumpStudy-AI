'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Wand2,
  Search,
  Trash2,
  Edit,
  Save,
  X,
  Sparkles,
  BookOpen,
  Tag,
} from 'lucide-react';

interface Note {
  id?: string;
  title: string;
  content: string;
  subject?: string;
  tags: string[];
  ai_generated: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NotesSystemProps {
  userId: string;
}

export default function NotesSystem({ userId }: NotesSystemProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const response = await fetch('/api/notes');
      const data = await response.json();
      if (data.notes) {
        setNotes(data.notes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }

  async function saveNote() {
    try {
      const noteData = {
        title: editTitle,
        content: editContent,
        subject: editSubject,
        tags: editTags,
        ai_generated: false,
      };

      const response = await fetch('/api/notes', {
        method: selectedNote?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          selectedNote?.id ? { ...noteData, id: selectedNote.id } : noteData
        ),
      });

      const data = await response.json();

      if (data.note) {
        await loadNotes();
        setIsEditing(false);
        setIsCreatingNew(false);
        setSelectedNote(data.note);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  }

  async function deleteNote(id: string) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      await loadNotes();
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  }

  async function generateAINote() {
    if (!aiTopic.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic }),
      });

      const data = await response.json();

      if (data.note) {
        await loadNotes();
        setShowAIModal(false);
        setAiTopic('');
        setSelectedNote(data.note);
      } else {
        alert(data.error || 'Failed to generate note');
      }
    } catch (error) {
      console.error('Error generating note:', error);
      alert('Failed to generate note');
    } finally {
      setIsGenerating(false);
    }
  }

  async function enhanceWithAI() {
    if (!selectedNote || !editContent) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/notes/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      const data = await response.json();

      if (data.enhanced) {
        setEditContent(data.enhanced);
      } else {
        alert(data.error || 'Failed to enhance note');
      }
    } catch (error) {
      console.error('Error enhancing note:', error);
      alert('Failed to enhance note');
    } finally {
      setIsGenerating(false);
    }
  }

  function startNewNote() {
    setIsCreatingNew(true);
    setIsEditing(true);
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setEditSubject('');
    setEditTags([]);
  }

  function startEditing(note: Note) {
    setIsEditing(true);
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditSubject(note.subject || '');
    setEditTags(note.tags || []);
  }

  function addTag() {
    if (tagInput.trim() && !editTags.includes(tagInput.trim())) {
      setEditTags([...editTags, tagInput.trim()]);
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setEditTags(editTags.filter((t) => t !== tag));
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <button
            onClick={startNewNote}
            className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
          <button
            onClick={() => setShowAIModal(true)}
            className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AI Generate
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notes yet</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  setIsEditing(false);
                }}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  selectedNote?.id === note.id
                    ? 'bg-purple-50 border-2 border-purple-600'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{note.title}</h3>
                  {note.ai_generated && (
                    <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{note.content}</p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedNote || isCreatingNew ? (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedNote?.ai_generated && (
                  <span className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                    <Sparkles className="w-3 h-3" />
                    AI Generated
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={enhanceWithAI}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                      <Wand2 className="w-4 h-4" />
                      AI Enhance
                    </button>
                    <button
                      onClick={saveNote}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreatingNew(false);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(selectedNote!)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    {selectedNote && (
                      <button
                        onClick={() => deleteNote(selectedNote.id!)}
                        className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {isEditing ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full text-4xl font-bold border-none outline-none focus:outline-none"
                  />

                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Subject (optional)"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        placeholder="Add tag..."
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                      <button
                        onClick={addTag}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {editTags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:text-purple-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Start writing your note..."
                    className="w-full min-h-96 text-lg border border-gray-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                  />
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {selectedNote?.title}
                  </h1>
                  {selectedNote?.subject && (
                    <div className="flex items-center gap-2 mb-6">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{selectedNote.subject}</span>
                    </div>
                  )}
                  {selectedNote?.tags && selectedNote.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-6">
                      {selectedNote.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="prose max-w-none text-lg text-gray-800 whitespace-pre-wrap">
                    {selectedNote?.content}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FileText className="w-24 h-24 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Select a note or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Generate Note with AI</h2>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What topic should the note cover?
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, The French Revolution, Python Lists"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && generateAINote()}
                />
              </div>

              <button
                onClick={generateAINote}
                disabled={!aiTopic.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Note
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
