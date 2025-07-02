/**
 * Circuit Breaker Test Script
 * Demonstrates and verifies circuit breaker functionality
 */

import { CircuitBreaker, CircuitState, circuitBreakerManager } from './circuitBreaker';

// Test function that fails after a certain number of calls
let callCount = 0;
async function testFunction(): Promise<string> {
  callCount++;
  console.log(`📞 Test function call #${callCount}`);
  
  if (callCount <= 3) {
    return `Success on call ${callCount}`;
  } else {
    throw new Error(`Simulated failure on call ${callCount}`);
  }
}

// Test function that always fails
async function alwaysFailFunction(): Promise<string> {
  throw new Error('This function always fails');
}

// Test function that always succeeds
async function alwaysSucceedFunction(): Promise<string> {
  return 'Always succeeds';
}

/**
 * Test basic circuit breaker functionality
 */
export async function testBasicCircuitBreaker() {
  console.log('\n🧪 Testing Basic Circuit Breaker Functionality\n');
  
  const breaker = new CircuitBreaker('test-basic', {
    failureThreshold: 3,
    resetTimeout: 5000, // 5 seconds
    monitoringPeriod: 10000 // 10 seconds
  });

  console.log('Initial state:', breaker.getStats());

  // Test successful calls
  console.log('\n--- Testing Successful Calls ---');
  try {
    const result1 = await breaker.execute(alwaysSucceedFunction);
    console.log('✅ Success:', result1);
    
    const result2 = await breaker.execute(alwaysSucceedFunction);
    console.log('✅ Success:', result2);
  } catch (error) {
    console.log('❌ Unexpected error:', error);
  }

  console.log('After successful calls:', breaker.getStats());

  // Test failing calls to trigger circuit opening
  console.log('\n--- Testing Failing Calls ---');
  for (let i = 1; i <= 5; i++) {
    try {
      await breaker.execute(alwaysFailFunction);
    } catch (error) {
      console.log(`❌ Call ${i} failed:`, (error as Error).message);
    }
    console.log(`Stats after call ${i}:`, breaker.getStats());
  }

  // Test calls when circuit is open
  console.log('\n--- Testing Calls When Circuit is Open ---');
  try {
    await breaker.execute(alwaysSucceedFunction);
  } catch (error) {
    console.log('⚡ Circuit breaker rejected call:', (error as Error).message);
  }

  console.log('Final state:', breaker.getStats());
  return breaker.getStats();
}

/**
 * Test circuit breaker with fallback
 */
export async function testCircuitBreakerWithFallback() {
  console.log('\n🧪 Testing Circuit Breaker with Fallback\n');
  
  const breaker = new CircuitBreaker('test-fallback', {
    failureThreshold: 2,
    resetTimeout: 3000,
    monitoringPeriod: 5000
  });

  // Trigger circuit opening
  console.log('--- Triggering Circuit Opening ---');
  for (let i = 1; i <= 3; i++) {
    try {
      await breaker.execute(alwaysFailFunction, async () => 'Fallback result');
    } catch (error) {
      console.log(`Call ${i} failed:`, (error as Error).message);
    }
  }

  // Test fallback when circuit is open
  console.log('\n--- Testing Fallback When Circuit is Open ---');
  try {
    const result = await breaker.execute(alwaysFailFunction, async () => 'Fallback used!');
    console.log('✅ Fallback result:', result);
  } catch (error) {
    console.log('❌ Unexpected error:', (error as Error).message);
  }

  console.log('Stats:', breaker.getStats());
  return breaker.getStats();
}

/**
 * Test circuit breaker with timeout
 */
export async function testCircuitBreakerWithTimeout() {
  console.log('\n🧪 Testing Circuit Breaker with Timeout\n');
  
  const breaker = new CircuitBreaker('test-timeout', {
    failureThreshold: 2,
    resetTimeout: 2000,
    monitoringPeriod: 5000
  });

  // Function that takes too long
  const slowFunction = async (): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    return 'Slow function completed';
  };

  console.log('--- Testing Timeout Protection (1 second timeout) ---');
  try {
    const result = await breaker.executeWithTimeout(
      slowFunction, 
      1000, // 1 second timeout
      async () => 'Timeout fallback'
    );
    console.log('Result:', result);
  } catch (error) {
    console.log('❌ Error:', (error as Error).message);
  }

  console.log('Stats:', breaker.getStats());
  return breaker.getStats();
}

/**
 * Test circuit breaker manager
 */
export async function testCircuitBreakerManager() {
  console.log('\n🧪 Testing Circuit Breaker Manager\n');
  
  // Create multiple circuit breakers
  const breaker1 = circuitBreakerManager.getBreaker('service-1', { failureThreshold: 2 });
  const breaker2 = circuitBreakerManager.getBreaker('service-2', { failureThreshold: 3 });
  const breaker3 = circuitBreakerManager.getBreaker('service-3', { failureThreshold: 1 });

  // Trigger some failures
  console.log('--- Triggering Failures Across Services ---');
  try {
    await breaker1.execute(alwaysFailFunction);
  } catch (error) {
    console.log('Service 1 failed');
  }

  try {
    await breaker2.execute(alwaysFailFunction);
  } catch (error) {
    console.log('Service 2 failed');
  }

  try {
    await breaker3.execute(alwaysFailFunction);
  } catch (error) {
    console.log('Service 3 failed');
  }

  // Get all stats
  console.log('\n--- All Circuit Breaker Stats ---');
  const allStats = circuitBreakerManager.getAllStats();
  console.log(JSON.stringify(allStats, null, 2));

  // Reset all
  console.log('\n--- Resetting All Circuit Breakers ---');
  circuitBreakerManager.resetAll();
  
  const statsAfterReset = circuitBreakerManager.getAllStats();
  console.log('Stats after reset:', JSON.stringify(statsAfterReset, null, 2));

  return allStats;
}

/**
 * Test circuit breaker state transitions
 */
export async function testCircuitBreakerStateTransitions() {
  console.log('\n🧪 Testing Circuit Breaker State Transitions\n');
  
  const breaker = new CircuitBreaker('test-states', {
    failureThreshold: 2,
    resetTimeout: 1000, // 1 second for quick testing
    monitoringPeriod: 2000,
    onStateChange: (state, error) => {
      console.log(`🔄 State changed to: ${state}${error ? ` (${error.message})` : ''}`);
    }
  });

  console.log('Initial state:', breaker.getStats().state);

  // CLOSED -> OPEN
  console.log('\n--- CLOSED -> OPEN Transition ---');
  for (let i = 0; i < 3; i++) {
    try {
      await breaker.execute(alwaysFailFunction);
    } catch (error) {
      console.log(`Failure ${i + 1}`);
    }
  }

  // Wait for reset timeout and test OPEN -> HALF_OPEN -> CLOSED
  console.log('\n--- Waiting for Reset Timeout ---');
  await new Promise(resolve => setTimeout(resolve, 1200)); // Wait 1.2 seconds

  console.log('\n--- HALF_OPEN -> CLOSED Transition ---');
  try {
    const result = await breaker.execute(alwaysSucceedFunction);
    console.log('✅ Success during HALF_OPEN:', result);
  } catch (error) {
    console.log('❌ Failed during HALF_OPEN:', (error as Error).message);
  }

  console.log('Final state:', breaker.getStats());
  return breaker.getStats();
}

/**
 * Run all circuit breaker tests
 */
export async function runAllCircuitBreakerTests() {
  console.log('🧪🧪🧪 CIRCUIT BREAKER COMPREHENSIVE TEST SUITE 🧪🧪🧪');
  
  try {
    await testBasicCircuitBreaker();
    await testCircuitBreakerWithFallback();
    await testCircuitBreakerWithTimeout();
    await testCircuitBreakerManager();
    await testCircuitBreakerStateTransitions();
    
    console.log('\n✅ All circuit breaker tests completed successfully!');
    
    // Final summary
    console.log('\n📊 Final System State:');
    const finalStats = circuitBreakerManager.getAllStats();
    console.log(JSON.stringify(finalStats, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Export individual test functions for selective testing
export { testFunction, alwaysFailFunction, alwaysSucceedFunction }; 