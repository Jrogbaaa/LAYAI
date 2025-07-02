import { NextRequest, NextResponse } from 'next/server';
import { circuitBreakerManager } from '@/lib/circuitBreaker';

export async function GET() {
  try {
    // Get all circuit breaker statistics
    const allStats = circuitBreakerManager.getAllStats();
    
    // Calculate overall system health
    const totalRequests = Object.values(allStats).reduce((sum, stats) => sum + stats.totalRequests, 0);
    const totalRejected = Object.values(allStats).reduce((sum, stats) => sum + stats.rejectedRequests, 0);
    const openBreakers = Object.values(allStats).filter(stats => stats.state === 'OPEN').length;
    
    const systemHealth = {
      status: openBreakers === 0 ? 'healthy' : openBreakers < 3 ? 'degraded' : 'critical',
      totalRequests,
      totalRejected,
      rejectionRate: totalRequests > 0 ? ((totalRejected / totalRequests) * 100).toFixed(2) + '%' : '0%',
      openCircuits: openBreakers,
      totalCircuits: Object.keys(allStats).length
    };
    
    return NextResponse.json({
      success: true,
      systemHealth,
      circuitBreakers: allStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting circuit breaker status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get circuit breaker status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, circuit } = body;
    
    if (action === 'reset') {
      if (circuit === 'all') {
        circuitBreakerManager.resetAll();
        console.log('🔄 All circuit breakers reset via API');
        return NextResponse.json({
          success: true,
          message: 'All circuit breakers reset',
          timestamp: new Date().toISOString()
        });
      } else if (circuit) {
        const breaker = circuitBreakerManager.getBreaker(circuit);
        breaker.reset();
        console.log(`🔄 Circuit breaker '${circuit}' reset via API`);
        return NextResponse.json({
          success: true,
          message: `Circuit breaker '${circuit}' reset`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    if (action === 'force-open' && circuit) {
      const breaker = circuitBreakerManager.getBreaker(circuit);
      breaker.forceOpen();
      console.log(`🚨 Circuit breaker '${circuit}' forced open via API`);
      return NextResponse.json({
        success: true,
        message: `Circuit breaker '${circuit}' forced open`,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid action or missing circuit parameter',
        validActions: ['reset', 'force-open'],
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error controlling circuit breakers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to control circuit breakers',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 