import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    console.log('🔄 Starting notes migration from data/notes.json to Firebase...');
    
    // Read notes from JSON file
    const notesPath = path.join(process.cwd(), 'data', 'notes.json');
    
    if (!fs.existsSync(notesPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'No notes.json file found' 
      }, { status: 404 });
    }
    
    const notesData = JSON.parse(fs.readFileSync(notesPath, 'utf8'));
    console.log(`📝 Found ${notesData.length} notes to migrate`);
    
    const migratedNotes = [];
    
    // Migrate each note to Firebase
    for (const note of notesData) {
      try {
        // Convert date strings to Timestamps
        const noteData = {
          title: note.title,
          content: note.content,
          createdAt: Timestamp.fromDate(new Date(note.createdAt)),
          updatedAt: Timestamp.fromDate(new Date(note.updatedAt))
        };
        
        // Add to Firebase
        const docRef = await addDoc(collection(db, 'notes'), noteData);
        console.log(`✅ Migrated note: "${note.title}" -> ${docRef.id}`);
        
        migratedNotes.push({
          id: docRef.id,
          title: note.title,
          originalId: note.id
        });
        
      } catch (error) {
        console.error(`❌ Error migrating note "${note.title}":`, error);
      }
    }
    
    console.log('🎉 Notes migration completed successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notes migrated successfully',
      migratedNotes,
      count: migratedNotes.length
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 