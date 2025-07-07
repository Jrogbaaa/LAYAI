/**
 * Firebase Write Throttling System
 * Prevents resource exhaustion by batching writes and implementing rate limiting
 */

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';

interface QueuedWrite {
  id: string;
  type: 'create' | 'update';
  collection: string;
  docId?: string;
  data: any;
  resolve: (result: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
}

interface ThrottleConfig {
  batchSize: number;
  batchInterval: number; // milliseconds
  maxQueueSize: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Firebase Write Throttler
 */
export class FirebaseWriteThrottler {
  private writeQueue: QueuedWrite[] = [];
  private isProcessing = false;
  private batchTimer: NodeJS.Timeout | null = null;
  
  private config: ThrottleConfig = {
    batchSize: 10, // Max writes per batch
    batchInterval: 2000, // Process batches every 2 seconds
    maxQueueSize: 500, // Max queued operations
    retryAttempts: 3,
    retryDelay: 1000
  };

  private stats = {
    totalWrites: 0,
    batchedWrites: 0,
    failedWrites: 0,
    avgBatchSize: 0,
    lastBatchTime: Date.now()
  };

  constructor(config?: Partial<ThrottleConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Start the batch processor
    this.startBatchProcessor();
    
    console.log(`🔥 Firebase Write Throttler initialized: ${this.config.batchSize} writes per ${this.config.batchInterval}ms`);
  }

  /**
   * Queue a write operation with throttling
   */
  async queueWrite(
    collectionName: string,
    data: any,
    docId?: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check queue size limit
      if (this.writeQueue.length >= this.config.maxQueueSize) {
        reject(new Error('Write queue is full. Please try again later.'));
        return;
      }

      const queuedWrite: QueuedWrite = {
        id: `write_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: docId ? 'update' : 'create',
        collection: collectionName,
        docId,
        data: this.prepareData(data),
        resolve,
        reject,
        timestamp: Date.now(),
        priority
      };

      // Insert based on priority
      if (priority === 'high') {
        this.writeQueue.unshift(queuedWrite);
      } else {
        this.writeQueue.push(queuedWrite);
      }

      console.log(`📝 Queued ${queuedWrite.type} for ${collectionName} (${this.writeQueue.length} in queue)`);

      // Process immediately if high priority and queue is small
      if (priority === 'high' && this.writeQueue.length <= 5) {
        this.processBatch();
      }
    });
  }

  /**
   * Queue multiple writes as a batch
   */
  async queueBatchWrites(
    writes: Array<{
      collection: string;
      data: any;
      docId?: string;
    }>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<any[]> {
    const promises = writes.map(write => 
      this.queueWrite(write.collection, write.data, write.docId, priority)
    );
    
    return Promise.all(promises);
  }

  /**
   * Start the batch processor
   */
  private startBatchProcessor(): void {
    this.batchTimer = setInterval(() => {
      if (this.writeQueue.length > 0 && !this.isProcessing) {
        this.processBatch();
      }
    }, this.config.batchInterval);
  }

  /**
   * Process a batch of writes
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.writeQueue.length === 0) return;

    this.isProcessing = true;
    const batchSize = Math.min(this.config.batchSize, this.writeQueue.length);
    const batch = this.writeQueue.splice(0, batchSize);

    console.log(`🔄 Processing batch of ${batch.length} writes...`);

    try {
      await this.executeBatch(batch);
      this.stats.batchedWrites += batch.length;
      this.stats.totalWrites += batch.length;
      this.stats.avgBatchSize = this.stats.totalWrites / (this.stats.batchedWrites / batch.length);
      this.stats.lastBatchTime = Date.now();
      
      console.log(`✅ Batch processed successfully: ${batch.length} writes`);
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      
      // Retry failed writes
      await this.retryFailedWrites(batch, error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a batch of writes using Firestore batch operations
   */
  private async executeBatch(writes: QueuedWrite[]): Promise<void> {
    if (writes.length === 1) {
      // Single write - use individual operation
      await this.executeSingleWrite(writes[0]);
      return;
    }

    // Multiple writes - use batch operation
    const batch = writeBatch(db);
    const results: any[] = [];

    for (const write of writes) {
      try {
        if (write.type === 'create') {
          const docRef = doc(collection(db, write.collection));
          batch.set(docRef, write.data);
          results.push({ id: docRef.id, ...write.data });
        } else if (write.type === 'update' && write.docId) {
          const docRef = doc(db, write.collection, write.docId);
          batch.update(docRef, write.data);
          results.push({ id: write.docId, ...write.data });
        }
      } catch (error) {
        write.reject(error);
        continue;
      }
    }

    // Commit the batch
    await batch.commit();

    // Resolve all promises
    writes.forEach((write, index) => {
      write.resolve(results[index]);
    });
  }

  /**
   * Execute a single write operation
   */
  private async executeSingleWrite(write: QueuedWrite): Promise<void> {
    try {
      let result;
      
      if (write.type === 'create') {
        const docRef = await addDoc(collection(db, write.collection), write.data);
        result = { id: docRef.id, ...write.data };
      } else if (write.type === 'update' && write.docId) {
        const docRef = doc(db, write.collection, write.docId);
        await updateDoc(docRef, write.data);
        result = { id: write.docId, ...write.data };
      } else {
        throw new Error('Invalid write operation');
      }
      
      write.resolve(result);
    } catch (error) {
      write.reject(error);
    }
  }

  /**
   * Retry failed writes with exponential backoff
   */
  private async retryFailedWrites(writes: QueuedWrite[], error: any): Promise<void> {
    this.stats.failedWrites += writes.length;
    
    // Check if error is retryable
    if (this.isRetryableError(error)) {
      console.log(`🔄 Retrying ${writes.length} failed writes...`);
      
      // Add failed writes back to queue with delay
      setTimeout(() => {
        writes.forEach(write => {
          write.priority = 'high'; // Retry with high priority
          this.writeQueue.unshift(write);
        });
      }, this.config.retryDelay);
    } else {
      // Non-retryable error - reject all writes
      writes.forEach(write => {
        write.reject(error);
      });
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'resource-exhausted',
      'unavailable',
      'deadline-exceeded',
      'internal',
      'aborted'
    ];
    
    return retryableErrors.some(code => 
      error?.code?.includes(code) || error?.message?.includes(code)
    );
  }

  /**
   * Prepare data for writing (convert dates, etc.)
   */
  public prepareData(data: any): any {
    const prepared = { ...data };
    
    // Convert Date objects to Firestore Timestamps
    Object.keys(prepared).forEach(key => {
      if (prepared[key] instanceof Date) {
        prepared[key] = Timestamp.fromDate(prepared[key]);
      } else if (key === 'createdAt' || key === 'updatedAt') {
        if (!prepared[key]) {
          prepared[key] = Timestamp.now();
        }
      }
    });
    
    return prepared;
  }

  /**
   * Get throttler statistics
   */
  getStats(): {
    queueSize: number;
    totalWrites: number;
    batchedWrites: number;
    failedWrites: number;
    avgBatchSize: number;
    lastBatchTime: number;
    isProcessing: boolean;
  } {
    return {
      queueSize: this.writeQueue.length,
      totalWrites: this.stats.totalWrites,
      batchedWrites: this.stats.batchedWrites,
      failedWrites: this.stats.failedWrites,
      avgBatchSize: this.stats.avgBatchSize,
      lastBatchTime: this.stats.lastBatchTime,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Update throttling configuration
   */
  updateConfig(newConfig: Partial<ThrottleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`🔧 Throttler config updated:`, this.config);
  }

  /**
   * Stop the throttler and clear queue
   */
  stop(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Reject remaining queued writes
    this.writeQueue.forEach(write => {
      write.reject(new Error('Throttler stopped'));
    });
    
    this.writeQueue = [];
    console.log('🛑 Firebase Write Throttler stopped');
  }

  /**
   * Force process all queued writes immediately
   */
  async flush(): Promise<void> {
    console.log(`🚀 Flushing ${this.writeQueue.length} queued writes...`);
    
    while (this.writeQueue.length > 0 && !this.isProcessing) {
      await this.processBatch();
      // Small delay to prevent overwhelming Firebase
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ All writes flushed');
  }
}

/**
 * Global throttler instance
 */
export const firebaseThrottler = new FirebaseWriteThrottler({
  batchSize: 15, // Slightly larger batches for campaigns
  batchInterval: 1500, // Process every 1.5 seconds
  maxQueueSize: 1000, // Allow more queued operations
  retryAttempts: 3,
  retryDelay: 2000
});

/**
 * Convenience functions for common operations
 */
export async function throttledCreate(collection: string, data: any, priority?: 'high' | 'normal' | 'low'): Promise<any> {
  return firebaseThrottler.queueWrite(collection, data, undefined, priority);
}

export async function throttledUpdate(collection: string, docId: string, data: any, priority?: 'high' | 'normal' | 'low'): Promise<any> {
  return firebaseThrottler.queueWrite(collection, data, docId, priority);
}

export async function throttledBatchCreate(collection: string, dataArray: any[], priority?: 'high' | 'normal' | 'low'): Promise<any[]> {
  const writes = dataArray.map(data => ({ collection, data }));
  return firebaseThrottler.queueBatchWrites(writes, priority);
}

/**
 * Emergency mode for high-priority writes
 */
export async function emergencyWrite(collectionName: string, data: any, docId?: string): Promise<any> {
  try {
    if (docId) {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, firebaseThrottler.prepareData(data));
      return { id: docId, ...data };
    } else {
      const docRef = await addDoc(collection(db, collectionName), firebaseThrottler.prepareData(data));
      return { id: docRef.id, ...data };
    }
  } catch (error) {
    console.error('❌ Emergency write failed:', error);
    throw error;
  }
} 