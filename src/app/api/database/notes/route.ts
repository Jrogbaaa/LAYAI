import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';

const NOTES_COLLECTION = 'notes';

// Load notes from Firebase
async function loadNotes() {
  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error('Error loading notes from Firebase:', error);
    return [];
  }
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

    switch (action) {
      case 'create':
        const newNote = {
          title: title || 'Untitled Note',
          content: content || '',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        const docRef = await addDoc(collection(db, NOTES_COLLECTION), newNote);
        const createdNote = {
          id: docRef.id,
          ...newNote,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return NextResponse.json({ success: true, note: createdNote });

      case 'update':
        if (!noteId) {
          return NextResponse.json({ success: false, error: 'Note ID required' }, { status: 400 });
        }
        
        const noteRef = doc(db, NOTES_COLLECTION, noteId);
        const noteDoc = await getDoc(noteRef);
        
        if (!noteDoc.exists()) {
          return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
        }
        
        const updateData: any = {
          updatedAt: Timestamp.now()
        };
        
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        
        await updateDoc(noteRef, updateData);
        
        const updatedNote = {
          id: noteId,
          ...noteDoc.data(),
          ...updateData,
          updatedAt: new Date()
        };
        
        return NextResponse.json({ success: true, note: updatedNote });

      case 'delete':
        if (!noteId) {
          return NextResponse.json({ success: false, error: 'Note ID required' }, { status: 400 });
        }
        
        const deleteNoteRef = doc(db, NOTES_COLLECTION, noteId);
        await deleteDoc(deleteNoteRef);
        
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling note request:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
} 