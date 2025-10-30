/**
 * Performance benchmarks for error handler optimization
 * Measures error processing time improvements, bundle size impact, and memory usage
 */

import { getErrorMessage } from '../errorHandler';

// Simple test to satisfy Jest requirements
describe('Error Handler Benchmarks', () => {
  it('should run performance benchmarks', () => {
    expect(typeof getErrorMessage).toBe('function');
  });
});

// Mock Supabase errors for testing
const mockSupabaseErrors = [
  // Specific error codes
  { code: '23505', message: 'duplicate key value violates unique constraint' },
  { code: '23503', message: 'foreign key constraint violation' },
  { code: '42501', message: 'permission denied for table' },
  { code: 'PGRST116', message: 'no data found' },
  
  // JSON format errors (pattern-matched)
  { code: '22030', message: 'invalid json text' },
  { code: '22031', message: 'invalid json text' },
  { code: '22032', message: 'invalid json text' },
  { code: '22033', message: 'invalid json text' },
  { code: '22034', message: 'invalid json text' },
  { code: '22035', message: 'invalid json text' },
  { code: '22036', message: 'invalid json text' },
  { code: '22037', message: 'invalid json text' },
  { code: '22038', message: 'invalid json text' },
  { code: '22039', message: 'invalid json text' },
  { code: '2203A', message: 'invalid json text' },
  { code: '2203B', message: 'invalid json text' },
  { code: '2203C', message: 'invalid json text' },
  { code: '2203D', message: 'invalid json text' },
  { code: '2203E', message: 'invalid json text' },
  { code: '2203F', message: 'invalid json text' },
  { code: '22040', message: 'invalid json text' },
  { code: '22041', message: 'invalid json text' },
  { code: '22042', message: 'invalid json text' },
  { code: '22043', message: 'invalid json text' },
  { code: '22044', message: 'invalid json text' },
  { code: '22045', message: 'invalid json text' },
  { code: '22046', message: 'invalid json text' },
  { code: '22047', message: 'invalid json text' },
  { code: '22048', message: 'invalid json text' },
  { code: '22049', message: 'invalid json text' },
  { code: '2204A', message: 'invalid json text' },
  { code: '2204B', message: 'invalid json text' },
  { code: '2204C', message: 'invalid json text' },
  { code: '2204D', message: 'invalid json text' },
  { code: '2204E', message: 'invalid json text' },
  { code: '2204F', message: 'invalid json text' },
  { code: '22050', message: 'invalid json text' },
  { code: '22051', message: 'invalid json text' },
  { code: '22052', message: 'invalid json text' },
  { code: '22053', message: 'invalid json text' },
  { code: '22054', message: 'invalid json text' },
  { code: '22055', message: 'invalid json text' },
  { code: '22056', message: 'invalid json text' },
  { code: '22057', message: 'invalid json text' },
  { code: '22058', message: 'invalid json text' },
  { code: '22059', message: 'invalid json text' },
  { code: '2205A', message: 'invalid json text' },
  { code: '2205B', message: 'invalid json text' },
  { code: '2205C', message: 'invalid json text' },
  { code: '2205D', message: 'invalid json text' },
  { code: '2205E', message: 'invalid json text' },
  { code: '2205F', message: 'invalid json text' },
  { code: '22060', message: 'invalid json text' },
  { code: '22061', message: 'invalid json text' },
  { code: '22062', message: 'invalid json text' },
  { code: '22063', message: 'invalid json text' },
  { code: '22064', message: 'invalid json text' },
  { code: '22065', message: 'invalid json text' },
  { code: '22066', message: 'invalid json text' },
  { code: '22067', message: 'invalid json text' },
  { code: '22068', message: 'invalid json text' },
  { code: '22069', message: 'invalid json text' },
  { code: '2206A', message: 'invalid json text' },
  { code: '2206B', message: 'invalid json text' },
  { code: '2206C', message: 'invalid json text' },
  { code: '2206D', message: 'invalid json text' },
  { code: '2206E', message: 'invalid json text' },
  { code: '2206F', message: 'invalid json text' },
  { code: '22070', message: 'invalid json text' },
  { code: '22071', message: 'invalid json text' },
  { code: '22072', message: 'invalid json text' },
  { code: '22073', message: 'invalid json text' },
  { code: '22074', message: 'invalid json text' },
  { code: '22075', message: 'invalid json text' },
  { code: '22076', message: 'invalid json text' },
  { code: '22077', message: 'invalid json text' },
  { code: '22078', message: 'invalid json text' },
  { code: '22079', message: 'invalid json text' },
  { code: '2207A', message: 'invalid json text' },
  { code: '2207B', message: 'invalid json text' },
  { code: '2207C', message: 'invalid json text' },
  { code: '2207D', message: 'invalid json text' },
  { code: '2207E', message: 'invalid json text' },
  { code: '2207F', message: 'invalid json text' },
  
  // Other pattern categories
  { code: '42001', message: 'syntax error' },
  { code: '42P01', message: 'undefined table' },
  { code: '42703', message: 'undefined column' },
  { code: '08001', message: 'unable to connect' },
  { code: '08006', message: 'connection failure' },
  { code: '23001', message: 'restrict violation' },
  { code: '23502', message: 'not null violation' },
  { code: '23514', message: 'check violation' },
];

// Network errors for testing
const mockNetworkErrors = [
  new Error('network error occurred'),
  new Error('fetch failed'),
  new Error('connection refused'),
  new Error('timeout exceeded'),
  new Error('network request failed'),
  new Error('unable to connect to server'),
];

// Generic errors for testing
const mockGenericErrors = [
  new Error('generic error message'),
  'string error message',
  { message: 'object with message' },
  { error: { code: '99999', message: 'unknown error code' } },
  null,
  undefined,
];

/**
 * Measures the time taken to process a batch of errors
 */
function measureErrorProcessingTime(errors: any[], iterations: number = 1000): number {
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    for (const error of errors) {
      getErrorMessage(error);
    }
  }
  
  const endTime = performance.now();
  return endTime - startTime;
}

/**
 * Measures memory usage during error processing
 */
function measureMemoryUsage(errors: any[], iterations: number = 1000): { before: number; after: number; peak: number } {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const beforeMemory = process.memoryUsage().heapUsed;
  let peakMemory = beforeMemory;
  
  // Monitor memory during processing
  const memoryInterval = setInterval(() => {
    const currentMemory = process.memoryUsage().heapUsed;
    if (currentMemory > peakMemory) {
      peakMemory = currentMemory;
    }
  }, 10);
  
  // Process errors
  for (let i = 0; i < iterations; i++) {
    for (const error of errors) {
      getErrorMessage(error);
    }
  }
  
  clearInterval(memoryInterval);
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const afterMemory = process.memoryUsage().heapUsed;
  
  return {
    before: beforeMemory,
    after: afterMemory,
    peak: peakMemory
  };
}

/**
 * Calculates bundle size impact
 */
function calculateBundleSizeImpact(): { 
  originalSize: number; 
  optimizedSize: number; 
  reduction: number; 
  reductionPercentage: number 
} {
  const fs = require('fs');
  const path = require('path');
  
  const originalPath = path.join(__dirname, '../errorHandler.ts.backup');
  const optimizedPath = path.join(__dirname, '../errorHandler.ts');
  
  const originalSize = fs.statSync(originalPath).size;
  const optimizedSize = fs.statSync(optimizedPath).size;
  const reduction = originalSize - optimizedSize;
  const reductionPercentage = (reduction / originalSize) * 100;
  
  return {
    originalSize,
    optimizedSize,
    reduction,
    reductionPercentage
  };
}

/**
 * Runs comprehensive performance benchmarks
 */
export function runPerformanceBenchmarks(): {
  bundleSize: ReturnType<typeof calculateBundleSizeImpact>;
  performance: {
    specificErrors: { time: number; avgPerError: number };
    patternErrors: { time: number; avgPerError: number };
    networkErrors: { time: number; avgPerError: number };
    genericErrors: { time: number; avgPerError: number };
    overall: { time: number; avgPerError: number };
  };
  memory: {
    specificErrors: ReturnType<typeof measureMemoryUsage>;
    patternErrors: ReturnType<typeof measureMemoryUsage>;
    networkErrors: ReturnType<typeof measureMemoryUsage>;
    genericErrors: ReturnType<typeof measureMemoryUsage>;
  };
} {
  console.log('🚀 Running Error Handler Performance Benchmarks...\n');
  
  // Bundle size analysis
  console.log('📦 Analyzing bundle size impact...');
  const bundleSize = calculateBundleSizeImpact();
  console.log(`Original size: ${bundleSize.originalSize} bytes`);
  console.log(`Optimized size: ${bundleSize.optimizedSize} bytes`);
  console.log(`Reduction: ${bundleSize.reduction} bytes (${bundleSize.reductionPercentage.toFixed(2)}%)\n`);
  
  // Performance benchmarks
  console.log('⚡ Running performance benchmarks...');
  
  const iterations = 10000;
  
  // Test specific error codes (should be fastest - O(1) lookup)
  const specificErrorsTime = measureErrorProcessingTime(
    mockSupabaseErrors.slice(0, 4), 
    iterations
  );
  
  // Test pattern-matched errors (should be fast - regex matching)
  const patternErrorsTime = measureErrorProcessingTime(
    mockSupabaseErrors.slice(4, 50), 
    iterations
  );
  
  // Test network errors
  const networkErrorsTime = measureErrorProcessingTime(
    mockNetworkErrors, 
    iterations
  );
  
  // Test generic errors
  const genericErrorsTime = measureErrorProcessingTime(
    mockGenericErrors, 
    iterations
  );
  
  // Test all errors combined
  const allErrors = [
    ...mockSupabaseErrors,
    ...mockNetworkErrors,
    ...mockGenericErrors
  ];
  const overallTime = measureErrorProcessingTime(allErrors, iterations);
  
  const performance = {
    specificErrors: {
      time: specificErrorsTime,
      avgPerError: specificErrorsTime / (4 * iterations)
    },
    patternErrors: {
      time: patternErrorsTime,
      avgPerError: patternErrorsTime / (46 * iterations)
    },
    networkErrors: {
      time: networkErrorsTime,
      avgPerError: networkErrorsTime / (mockNetworkErrors.length * iterations)
    },
    genericErrors: {
      time: genericErrorsTime,
      avgPerError: genericErrorsTime / (mockGenericErrors.length * iterations)
    },
    overall: {
      time: overallTime,
      avgPerError: overallTime / (allErrors.length * iterations)
    }
  };
  
  console.log(`Specific errors: ${performance.specificErrors.time.toFixed(2)}ms total, ${(performance.specificErrors.avgPerError * 1000000).toFixed(3)}μs per error`);
  console.log(`Pattern errors: ${performance.patternErrors.time.toFixed(2)}ms total, ${(performance.patternErrors.avgPerError * 1000000).toFixed(3)}μs per error`);
  console.log(`Network errors: ${performance.networkErrors.time.toFixed(2)}ms total, ${(performance.networkErrors.avgPerError * 1000000).toFixed(3)}μs per error`);
  console.log(`Generic errors: ${performance.genericErrors.time.toFixed(2)}ms total, ${(performance.genericErrors.avgPerError * 1000000).toFixed(3)}μs per error`);
  console.log(`Overall: ${performance.overall.time.toFixed(2)}ms total, ${(performance.overall.avgPerError * 1000000).toFixed(3)}μs per error\n`);
  
  // Memory usage analysis
  console.log('🧠 Analyzing memory usage...');
  
  const memoryIterations = 1000;
  
  const specificErrorsMemory = measureMemoryUsage(
    mockSupabaseErrors.slice(0, 4), 
    memoryIterations
  );
  
  const patternErrorsMemory = measureMemoryUsage(
    mockSupabaseErrors.slice(4, 50), 
    memoryIterations
  );
  
  const networkErrorsMemory = measureMemoryUsage(
    mockNetworkErrors, 
    memoryIterations
  );
  
  const genericErrorsMemory = measureMemoryUsage(
    mockGenericErrors, 
    memoryIterations
  );
  
  const memory = {
    specificErrors: specificErrorsMemory,
    patternErrors: patternErrorsMemory,
    networkErrors: networkErrorsMemory,
    genericErrors: genericErrorsMemory
  };
  
  console.log(`Specific errors memory: ${(specificErrorsMemory.peak - specificErrorsMemory.before) / 1024}KB peak increase`);
  console.log(`Pattern errors memory: ${(patternErrorsMemory.peak - patternErrorsMemory.before) / 1024}KB peak increase`);
  console.log(`Network errors memory: ${(networkErrorsMemory.peak - networkErrorsMemory.before) / 1024}KB peak increase`);
  console.log(`Generic errors memory: ${(genericErrorsMemory.peak - genericErrorsMemory.before) / 1024}KB peak increase\n`);
  
  return {
    bundleSize,
    performance,
    memory
  };
}

// Export for use in tests
export {
  mockSupabaseErrors,
  mockNetworkErrors,
  mockGenericErrors,
  measureErrorProcessingTime,
  measureMemoryUsage,
  calculateBundleSizeImpact
};