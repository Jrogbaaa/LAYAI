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
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Auto-save when content changes
  useEffect(() => {
    if (selectedNote && !isLoading) {
      const timeoutId = setTimeout(() => {
        saveNote();
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [selectedNote?.title, selectedNote?.content]);

  const loadNotes = async () => {
    try {
      const response = await fetch('/api/database/notes');
      const data = await response.json();
      if (data.success) {
        setNotes(data.notes);
        if (data.notes.length > 0 && !selectedNote) {
          setSelectedNote(data.notes[0]);
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error);
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
        })
      });

      const data = await response.json();
      if (data.success) {
        setNotes(prev => [data.note, ...prev]);
        setSelectedNote(data.note);
        // Focus on title for immediate editing
        setTimeout(() => titleRef.current?.focus(), 100);
      }
    } catch (error) {
      console.error('Error creating note:', error);
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
        })
      });

      const data = await response.json();
      if (data.success) {
        setNotes(prev => prev.map(note => 
          note.id === selectedNote.id ? data.note : note
        ));
        setSelectedNote(data.note);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch('/api/database/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          noteId
        })
      });

      const data = await response.json();
      if (data.success) {
        const updatedNotes = notes.filter(note => note.id !== noteId);
        setNotes(updatedNotes);
        
        if (selectedNote?.id === noteId) {
          setSelectedNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const updateSelectedNote = (field: 'title' | 'content', value: string) => {
    if (!selectedNote) return;
    
    setSelectedNote(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  const handleContentChange = () => {
    if (contentRef.current && selectedNote) {
      updateSelectedNote('content', contentRef.current.innerHTML);
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-900">Notes</h1>
            <button
              onClick={createNote}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="New Note"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedNote?.id === note.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {note.title || 'Untitled Note'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {note.content.replace(/<[^>]*>/g, '') || 'No content'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(note.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <input
                  ref={titleRef}
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => updateSelectedNote('title', e.target.value)}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none flex-1 mr-4"
                  placeholder="Untitled Note"
                />
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {isSaving && (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2"></div>
                      Saving...
                    </span>
                  )}
                  <span>Last updated: {formatDate(selectedNote.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 bg-white p-6">
                             <div
                 ref={contentRef}
                 contentEditable
                 onInput={handleContentChange}
                 dangerouslySetInnerHTML={{ __html: selectedNote.content || '<p style="color: #9ca3af;">Start writing...</p>' }}
                 className="min-h-full outline-none text-gray-900 leading-relaxed"
                 style={{
                   fontSize: '16px',
                   lineHeight: '1.6',
                   fontFamily: 'system-ui, -apple-system, sans-serif'
                 }}
               />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No note selected</h3>
              <p className="text-gray-500 mb-4">Choose a note from the sidebar or create a new one</p>
              <button
                onClick={createNote}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesManager; 