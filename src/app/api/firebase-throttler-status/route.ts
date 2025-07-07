import { NextRequest, NextResponse } from 'next/server';
import { firebaseThrottler } from '@/lib/firebaseThrottler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'flush') {
      // Force flush all queued writes
      await firebaseThrottler.flush();
      return NextResponse.json({ 
        success: true, 
        message: 'All queued writes have been flushed' 
      });
    }
    
    if (action === 'config') {
      // Get current configuration
      const stats = firebaseThrottler.getStats();
      return NextResponse.json({
        success: true,
        config: {
          batchSize: 15,
          batchInterval: 1500,
          maxQueueSize: 1000,
          retryAttempts: 3,
          retryDelay: 2000
        },
        stats
      });
    }
    
    // Default: return throttler status
    const stats = firebaseThrottler.getStats();
    
    // Calculate health metrics
    const healthScore = stats.totalWrites > 0 ? 
      Math.max(0, 100 - (stats.failedWrites / stats.totalWrites * 100)) : 100;
    
    const status = stats.queueSize > 0 ? 'processing' : 'idle';
    const priority = stats.queueSize > 500 ? 'high' : 
                    stats.queueSize > 100 ? 'medium' : 'low';
    
    const timeSinceLastBatch = Date.now() - stats.lastBatchTime;
    const isStale = timeSinceLastBatch > 10000; // 10 seconds
    
    return NextResponse.json({
      success: true,
      throttler: {
        status,
        priority,
        healthScore: Math.round(healthScore),
        isStale,
        queueSize: stats.queueSize,
        totalWrites: stats.totalWrites,
        batchedWrites: stats.batchedWrites,
        failedWrites: stats.failedWrites,
        avgBatchSize: Math.round(stats.avgBatchSize * 10) / 10,
        lastBatchTime: stats.lastBatchTime,
        timeSinceLastBatch,
        isProcessing: stats.isProcessing,
        recommendations: getRecommendations(stats)
      }
    });
    
  } catch (error) {
    console.error('Error getting throttler status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get throttler status' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;
    
    if (action === 'updateConfig') {
      // Update throttler configuration
      firebaseThrottler.updateConfig(config);
      return NextResponse.json({ 
        success: true, 
        message: 'Throttler configuration updated' 
      });
    }
    
    if (action === 'flush') {
      // Force flush all queued writes
      await firebaseThrottler.flush();
      return NextResponse.json({ 
        success: true, 
        message: 'All queued writes have been flushed' 
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error updating throttler:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update throttler' 
    }, { status: 500 });
  }
}

function getRecommendations(stats: any): string[] {
  const recommendations: string[] = [];
  
  if (stats.queueSize > 500) {
    recommendations.push('Queue size is high - consider increasing batch size or reducing batch interval');
  }
  
  if (stats.failedWrites > 0) {
    const failureRate = (stats.failedWrites / stats.totalWrites) * 100;
    if (failureRate > 10) {
      recommendations.push('High failure rate - check Firebase quotas and network connectivity');
    } else if (failureRate > 5) {
      recommendations.push('Moderate failure rate - monitor Firebase usage patterns');
    }
  }
  
  if (stats.isProcessing && Date.now() - stats.lastBatchTime > 30000) {
    recommendations.push('Processing has been running for a long time - may be stuck');
  }
  
  if (stats.queueSize === 0 && stats.totalWrites === 0) {
    recommendations.push('No writes have been processed yet - system is ready');
  }
  
  if (stats.avgBatchSize < 5) {
    recommendations.push('Average batch size is low - consider increasing batch size for better efficiency');
  }
  
  return recommendations;
} 