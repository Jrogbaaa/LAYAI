/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures and provides graceful degradation for external API calls
 */

export interface CircuitBreakerOptions {
  failureThreshold: number;     // Number of failures before opening circuit
  resetTimeout: number;         // Time in ms before attempting to close circuit
  monitoringPeriod: number;     // Time window for failure counting in ms
  onStateChange?: (state: CircuitState, error?: Error) => void;
}

export enum CircuitState {
  CLOSED = 'CLOSED',           // Normal operation
  OPEN = 'OPEN',               // Circuit is open, failing fast
  HALF_OPEN = 'HALF_OPEN'      // Testing if service has recovered
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  totalRequests: number;
  rejectedRequests: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: number;
  private totalRequests: number = 0;
  private rejectedRequests: number = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly name: string;

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 60000, // 1 minute
      onStateChange: options.onStateChange
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit should be closed based on monitoring period
    this.checkTimeWindow();

    if (this.state === CircuitState.OPEN) {
      this.rejectedRequests++;
      
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.notifyStateChange();
        console.log(`🔄 Circuit breaker ${this.name}: Attempting reset (HALF_OPEN)`);
      } else {
        console.log(`⚡ Circuit breaker ${this.name}: Request rejected (OPEN)`);
        
        if (fallback) {
          console.log(`🔄 Circuit breaker ${this.name}: Using fallback`);
          return await fallback();
        }
        
        throw new CircuitBreakerOpenError(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      
      if (fallback) {
        console.log(`🔄 Circuit breaker ${this.name}: Using fallback after failure`);
        return await fallback();
      }
      
      throw error;
    }
  }

  /**
   * Execute with timeout and circuit breaker protection
   */
  async executeWithTimeout<T>(
    fn: () => Promise<T>, 
    timeout: number,
    fallback?: () => Promise<T>
  ): Promise<T> {
    return this.execute(async () => {
      return Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
        )
      ]);
    }, fallback);
  }

  private onSuccess(): void {
    this.successCount++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.notifyStateChange();
      console.log(`✅ Circuit breaker ${this.name}: Reset successful (CLOSED)`);
    }
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.notifyStateChange(error);
      console.log(`🚨 Circuit breaker ${this.name}: Opened due to ${this.failureCount} failures`);
    } else {
      console.log(`⚠️ Circuit breaker ${this.name}: Failure ${this.failureCount}/${this.options.failureThreshold}`);
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== undefined && 
           (Date.now() - this.lastFailureTime) >= this.options.resetTimeout;
  }

  private checkTimeWindow(): void {
    if (this.lastFailureTime && 
        (Date.now() - this.lastFailureTime) >= this.options.monitoringPeriod) {
      // Reset failure count if outside monitoring period
      if (this.state === CircuitState.CLOSED) {
        this.failureCount = 0;
      }
    }
  }

  private notifyStateChange(error?: Error): void {
    if (this.options.onStateChange) {
      this.options.onStateChange(this.state, error);
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      totalRequests: this.totalRequests,
      rejectedRequests: this.rejectedRequests
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.notifyStateChange();
    console.log(`🔄 Circuit breaker ${this.name}: Manually reset`);
  }

  /**
   * Force circuit open (for testing or maintenance)
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.lastFailureTime = Date.now();
    this.notifyStateChange();
    console.log(`🚨 Circuit breaker ${this.name}: Manually opened`);
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Circuit Breaker Manager - Manages multiple circuit breakers
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  getBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    Array.from(this.breakers.entries()).forEach(([name, breaker]) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  resetAll(): void {
    Array.from(this.breakers.values()).forEach(breaker => {
      breaker.reset();
    });
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager();

// Pre-configured circuit breakers for common services
export const getSearchApiBreaker = () => circuitBreakerManager.getBreaker('search-api', {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000
});

export const getApifyBreaker = () => circuitBreakerManager.getBreaker('apify-api', {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 120000 // 2 minutes
});

export const getVerificationBreaker = () => circuitBreakerManager.getBreaker('verification-api', {
  failureThreshold: 3,
  resetTimeout: 45000, // 45 seconds
  monitoringPeriod: 90000
});

export const getWebSearchBreaker = () => circuitBreakerManager.getBreaker('web-search', {
  failureThreshold: 4,
  resetTimeout: 30000,
  monitoringPeriod: 60000
}); 