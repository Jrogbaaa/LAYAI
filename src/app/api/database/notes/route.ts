import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Load notes from file
async function loadNotes() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(NOTES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save notes to file
async function saveNotes(notes: any[]) {
  await ensureDataDir();
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
}

export async function GET() {
  try {
    const notes = await loadNotes();
    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('Error loading notes:', error);
    return NextResponse.json({ success: false, error: 'Failed to load notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, note, noteId, title, content } = body;

    const notes = await loadNotes();

    switch (action) {
      case 'create':
        const newNote = {
          id: `note_${Date.now()}`,
          title: title || 'Untitled Note',
          content: content || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        notes.push(newNote);
        await saveNotes(notes);
        return NextResponse.json({ success: true, note: newNote });

      case 'update':
        const noteIndex = notes.findIndex((n: any) => n.id === noteId);
        if (noteIndex === -1) {
          return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
        }
        
        notes[noteIndex] = {
          ...notes[noteIndex],
          title: title !== undefined ? title : notes[noteIndex].title,
          content: content !== undefined ? content : notes[noteIndex].content,
          updatedAt: new Date().toISOString()
        };
        await saveNotes(notes);
        return NextResponse.json({ success: true, note: notes[noteIndex] });

      case 'delete':
        const filteredNotes = notes.filter((n: any) => n.id !== noteId);
        await saveNotes(filteredNotes);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling note request:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
} 