'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const NotesManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (selectedNote && selectedNote.title && selectedNote.content !== undefined) {
      const timeoutId = setTimeout(() => {
        saveNote();
      }, 500); // Faster auto-save

      return () => clearTimeout(timeoutId);
    }
  }, [selectedNote?.title, selectedNote?.content]);

  const loadNotes = async () => {
    try {
      const response = await fetch('/api/database/notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async () => {
    try {
      const response = await fetch('/api/database/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create',
          title: 'Untitled Note',
          content: ''
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const newNote = result.note;
          setNotes(prev => [newNote, ...prev]);
          setSelectedNote(newNote);
          setShowMobileSidebar(false); // Close mobile sidebar when note is selected
        }
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const saveNote = async () => {
    if (!selectedNote) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/database/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update', 
          noteId: selectedNote.id,
          title: selectedNote.title,
          content: selectedNote.content
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotes(prev => prev.map(note => 
            note.id === selectedNote.id ? result.note : note
          ));
        }
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    const noteToDelete = notes.find(note => note.id === noteId);
    const noteName = noteToDelete?.title || 'Untitled Note';
    
    if (!confirm(`Are you sure you want to delete "${noteName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/database/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', noteId }),
      });

      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const updateSelectedNote = (field: 'title' | 'content', value: string) => {
    setSelectedNote(prev => prev ? {
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    } : null);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedNote) {
      updateSelectedNote('content', e.target.value);
    }
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setShowMobileSidebar(false); // Close mobile sidebar when note is selected
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">📝</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Notes</h1>
            <p className="text-xs text-gray-500">{notes.length} notes</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={createNote}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="New Note"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Show Notes List"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex h-full lg:h-screen">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:flex w-80 bg-white shadow-xl border-r border-gray-200 flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📝</span>
              </div>
              <h1 className="text-xl font-bold text-white">Notes</h1>
            </div>
            <button
              onClick={createNote}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors group"
              title="New Note"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-transparent text-sm bg-white/10 text-white placeholder-white/70 backdrop-blur-sm"
            />
            <svg className="w-4 h-4 text-white/70 absolute left-3 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="text-gray-900 font-medium mb-2">
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </h3>
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'Try a different search term' : 'Create your first note to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`group p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                    selectedNote?.id === note.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {note.title || 'Untitled Note'}
                      </h3>
                      <p className="text-gray-600 mt-1 line-clamp-2 text-xs leading-relaxed">
                        {note.content.replace(/<[^>]*>/g, '') || 'No content'}
                      </p>
                      <div className="flex items-center mt-3 space-x-2">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                          {formatDate(note.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                      title="Delete Note"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileSidebar(false)}>
            <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              {/* Mobile Sidebar Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📝</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Notes</h1>
                    <p className="text-xs text-white/80">{notes.length} notes</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Mobile Notes List */}
              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-180px)]">
                {filteredNotes.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📄</span>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-2">
                      {searchQuery ? 'No notes found' : 'No notes yet'}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {searchQuery ? 'Try a different search term' : 'Create your first note to get started'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => handleNoteSelect(note)}
                        className={`group p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                          selectedNote?.id === note.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate text-sm">
                              {note.title || 'Untitled Note'}
                            </h3>
                            <p className="text-gray-600 mt-1 line-clamp-2 text-xs leading-relaxed">
                              {note.content.replace(/<[^>]*>/g, '') || 'No content'}
                            </p>
                            <div className="flex items-center mt-3 space-x-2">
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                {formatDate(note.updatedAt)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(note.id);
                            }}
                            className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Delete Note"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
        {selectedNote ? (
          <>
            {/* Editor Header */}
              <div className="bg-white border-b border-gray-200 p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <input
                  ref={titleRef}
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => updateSelectedNote('title', e.target.value)}
                    className="text-lg lg:text-2xl font-bold text-gray-900 bg-transparent border-none outline-none flex-1 mr-4 focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
                  placeholder="Untitled Note"
                />
                  <div className="flex items-center space-x-2 lg:space-x-4 text-sm text-gray-500">
                  {isSaving && (
                      <span className="flex items-center bg-blue-50 text-blue-600 px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2"></div>
                      Saving...
                    </span>
                  )}
                    <span className="hidden lg:inline bg-gray-100 px-3 py-1 rounded-full text-xs">
                    Last updated: {formatDate(selectedNote.updatedAt)}
                  </span>
                  <button
                    onClick={() => deleteNote(selectedNote.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Delete Note"
                  >
                      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Content */}
              <div className="flex-1 bg-white p-4 lg:p-6 relative min-h-0">
              <textarea
                ref={contentRef}
                value={selectedNote.content || ''}
                onChange={handleContentChange}
                placeholder="Start writing your thoughts..."
                className="w-full h-full min-h-full resize-none outline-none text-gray-900 leading-relaxed border-none bg-transparent force-ltr-text focus:ring-2 focus:ring-blue-500 rounded-lg p-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '1.7',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  direction: 'ltr',
                  textAlign: 'left',
                  unicodeBidi: 'normal',
                  writingMode: 'horizontal-tb',
                  transform: 'none',
                  color: '#111827',
                  backgroundColor: 'transparent'
                }}
                dir="ltr"
                spellCheck="false"
              />
            </div>
          </>
        ) : (
            <div className="flex-1 flex items-center justify-center bg-white p-4 lg:p-0">
            <div className="text-center max-w-md">
                <div className="w-16 lg:w-24 h-16 lg:h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
                  <span className="text-2xl lg:text-3xl">✍️</span>
              </div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2 lg:mb-3">No note selected</h3>
                <p className="text-gray-600 mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base">
                Choose a note from the sidebar to start editing, or create a new one to capture your ideas.
              </p>
              <button
                onClick={createNote}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm lg:text-base"
              >
                Create New Note
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default NotesManager; 