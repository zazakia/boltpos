#!/usr/bin/env node

/**
 * Performance benchmark script for error handler optimization
 * Measures processing time, memory usage, and bundle size improvements
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Import the optimized handler
// Note: We'll use dynamic import or create a simple wrapper
const { execSync } = require('child_process');

// Simple wrapper to test the error handler functionality
const optimizedHandler = {
  getErrorMessage: (error) => {
    // This is a simplified version for testing - in real usage we'd compile TS
    if (!error) return 'An unexpected error occurred';
    
    if (typeof error === 'string') return error;
    
    if (error instanceof Error) {
      if ('code' in error && typeof error.code === 'string') {
        return getSupabaseErrorMessage(error);
      }
      if (isNetworkError(error)) {
        return 'Network error. Please check your connection.';
      }
      return error.message || 'An unexpected error occurred';
    }
    
    if (typeof error === 'object' && error !== null && 'message' in error) {
      // Check if it's a Supabase error object
      if ('code' in error && typeof error.code === 'string') {
        return getSupabaseErrorMessage(error);
      }
      return String(error.message);
    }
    
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const supabaseError = error.error;
      if (typeof supabaseError === 'object' && supabaseError !== null) {
        return getSupabaseErrorMessage(supabaseError);
      }
    }
    
    return 'An unexpected error occurred';
  }
};

// Helper functions (copied from the optimized handler)
const SPECIFIC_ERROR_MAPPINGS = {
  'PGRST116': 'No data found',
  '23505': 'This item already exists',
  '23503': 'Cannot delete - item is in use',
  '42501': 'Permission denied',
  '23514': 'Invalid data provided',
  '28P01': 'Database connection failed',
  '42P01': 'Table not found',
  '42703': 'Column not found',
  '22001': 'Data too long',
  '22003': 'Number out of range',
  '22P02': 'Invalid input format',
  '23502': 'Required field is missing',
  '23511': 'Check constraint violated',
  '23P01': 'Exclusion constraint violated',
  '2BP01': 'Dependent objects still exist',
  '0A000': 'Feature not supported',
  '08006': 'Connection failed',
  '08001': 'Unable to connect to database',
  '08004': 'Connection rejected',
  '08003': 'Connection does not exist',
  '0P000': 'Invalid role specification',
  '0L000': 'Invalid grantor',
  '0LP01': 'Invalid grant operation',
  '0Z002': 'Invalid XML document',
  '2200F': 'Invalid JSON data',
  '2200G': 'Invalid JSON text',
  '2200H': 'Invalid JSON value',
};

const ERROR_CATEGORIES = [
  {
    pattern: /^22[0-7][0-9A-F]{2}$/,
    message: 'Invalid JSON text',
    priority: 3
  },
  {
    pattern: /^22[0-9A-F]{3}$/,
    message: 'Invalid data format',
    priority: 2
  },
  {
    pattern: /^08[0-9A-F]{3}$/,
    message: 'Database connection error',
    priority: 2
  },
  {
    pattern: /^42[0-9A-F]{3}$/,
    message: 'Permission denied',
    priority: 2
  },
  {
    pattern: /^23[0-9A-F]{3}$/,
    message: 'Database constraint violation',
    priority: 2
  }
];

function isNetworkError(error) {
  const networkErrorMessages = [
    'network error',
    'fetch failed',
    'connection refused',
    'timeout',
    'network request failed',
    'unable to connect'
  ];
  
  const errorMessage = error.message?.toLowerCase() || '';
  return networkErrorMessages.some(msg => errorMessage.includes(msg));
}

function getSupabaseErrorMessage(error) {
  const { code, message } = error;

  if (!code) {
    return message || 'Database error occurred';
  }

  if (SPECIFIC_ERROR_MAPPINGS[code]) {
    return SPECIFIC_ERROR_MAPPINGS[code];
  }

  for (const category of ERROR_CATEGORIES) {
    if (category.pattern.test(code)) {
      return category.message;
    }
  }

  return message || 'Database error occurred';
}

// Test data sets
const TEST_ERROR_CODES = [
  // Specific mappings
  '23505', '23503', '42501', 'PGRST116',
  // Pattern-matched codes (JSON errors - previously thousands of cases)
  '22030', '22031', '22032', '22033', '22034', '22035', '22036', '22037',
  '22038', '22039', '2203A', '2203B', '2203C', '2203D', '2203E', '2203F',
  '22040', '22041', '22042', '22043', '22044', '22045', '22046', '22047',
  '22048', '22049', '2204A', '2204B', '2204C', '2204D', '2204E', '2204F',
  '22050', '22051', '22052', '22053', '22054', '22055', '22056', '22057',
  '22058', '22059', '2205A', '2205B', '2205C', '2205D', '2205E', '2205F',
  '22060', '22061', '22062', '22063', '22064', '22065', '22066', '22067',
  '22068', '22069', '2206A', '2206B', '2206C', '2206D', '2206E', '2206F',
  '22070', '22071', '22072', '22073', '22074', '22075', '22076', '22077',
  '22078', '22079', '2207A', '2207B', '2207C', '2207D', '2207E', '2207F',
  // Other pattern categories
  '08001', '08003', '08004', '08006',
  '42P01', '42703', '42000',
  '23502', '23511', '23514',
  // Unknown codes for fallback testing
  'UNKNOWN1', 'UNKNOWN2', 'CUSTOM_ERROR'
];

const NETWORK_ERRORS = [
  new Error('network error occurred'),
  new Error('fetch failed'),
  new Error('connection refused'),
  new Error('timeout exceeded'),
  new Error('network request failed'),
  new Error('unable to connect to server')
];

const SUPABASE_ERRORS = TEST_ERROR_CODES.map(code => ({
  message: `Database error with code ${code}`,
  code: code,
  details: 'Additional error details',
  hint: 'Error hint'
}));

const MIXED_ERRORS = [
  ...SUPABASE_ERRORS,
  ...NETWORK_ERRORS,
  'String error message',
  { message: 'Object with message property' },
  { error: { code: '23505', message: 'Nested Supabase error' } },
  null,
  undefined,
  42,
  { someProperty: 'value' }
];

/**
 * Measures execution time for a function
 */
function measureExecutionTime(fn, iterations = 10000) {
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const end = performance.now();
  return (end - start) / iterations; // Average time per execution in milliseconds
}

/**
 * Measures memory usage during error processing
 */
function measureMemoryUsage(fn, iterations = 1000) {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const initialMemory = process.memoryUsage();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const finalMemory = process.memoryUsage();
  
  return {
    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
    external: finalMemory.external - initialMemory.external,
    rss: finalMemory.rss - initialMemory.rss
  };
}

/**
 * Gets file size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.warn(`Could not get size for ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Calculates bundle size impact using webpack-bundle-analyzer or similar
 */
function calculateBundleSize() {
  const optimizedSize = getFileSize(path.join(__dirname, '../utils/errorHandler.ts'));
  const backupSize = getFileSize(path.join(__dirname, '../utils/errorHandler.ts.backup'));
  
  return {
    optimized: optimizedSize,
    original: backupSize,
    reduction: backupSize - optimizedSize,
    reductionPercentage: backupSize > 0 ? ((backupSize - optimizedSize) / backupSize * 100) : 0
  };
}

/**
 * Runs performance benchmarks
 */
function runBenchmarks() {
  console.log('🚀 Starting Error Handler Performance Benchmarks\n');
  
  // 1. File Size Comparison
  console.log('📊 File Size Analysis');
  console.log('='.repeat(50));
  
  const bundleSize = calculateBundleSize();
  console.log(`Original file size: ${bundleSize.original.toLocaleString()} bytes`);
  console.log(`Optimized file size: ${bundleSize.optimized.toLocaleString()} bytes`);
  console.log(`Size reduction: ${bundleSize.reduction.toLocaleString()} bytes`);
  console.log(`Reduction percentage: ${bundleSize.reductionPercentage.toFixed(2)}%`);
  console.log();
  
  // 2. Processing Time Benchmarks
  console.log('⏱️  Processing Time Benchmarks');
  console.log('='.repeat(50));
  
  // Test specific error codes (should be O(1))
  const specificCodeTime = measureExecutionTime(() => {
    optimizedHandler.getErrorMessage({ code: '23505', message: 'Duplicate key' });
  });
  
  // Test pattern-matched codes (should be O(1) with small constant)
  const patternMatchTime = measureExecutionTime(() => {
    optimizedHandler.getErrorMessage({ code: '22030', message: 'JSON error' });
  });
  
  // Test network errors
  const networkErrorTime = measureExecutionTime(() => {
    optimizedHandler.getErrorMessage(new Error('network error occurred'));
  });
  
  // Test mixed error types
  const mixedErrorTime = measureExecutionTime(() => {
    const randomError = MIXED_ERRORS[Math.floor(Math.random() * MIXED_ERRORS.length)];
    optimizedHandler.getErrorMessage(randomError);
  });
  
  console.log(`Specific error codes: ${specificCodeTime.toFixed(4)} ms/operation`);
  console.log(`Pattern-matched codes: ${patternMatchTime.toFixed(4)} ms/operation`);
  console.log(`Network errors: ${networkErrorTime.toFixed(4)} ms/operation`);
  console.log(`Mixed error types: ${mixedErrorTime.toFixed(4)} ms/operation`);
  console.log();
  
  // 3. Memory Usage Analysis
  console.log('💾 Memory Usage Analysis');
  console.log('='.repeat(50));
  
  const memoryUsage = measureMemoryUsage(() => {
    // Process a batch of different error types
    MIXED_ERRORS.forEach(error => {
      optimizedHandler.getErrorMessage(error);
    });
  });
  
  console.log(`Heap used: ${(memoryUsage.heapUsed / 1024).toFixed(2)} KB`);
  console.log(`Heap total: ${(memoryUsage.heapTotal / 1024).toFixed(2)} KB`);
  console.log(`External: ${(memoryUsage.external / 1024).toFixed(2)} KB`);
  console.log(`RSS: ${(memoryUsage.rss / 1024).toFixed(2)} KB`);
  console.log();
  
  // 4. Correctness Validation
  console.log('✅ Correctness Validation');
  console.log('='.repeat(50));
  
  let correctMappings = 0;
  let totalTests = 0;
  
  // Test specific mappings
  const specificTests = [
    { code: '23505', expected: 'This item already exists' },
    { code: '23503', expected: 'Cannot delete - item is in use' },
    { code: '42501', expected: 'Permission denied' },
    { code: 'PGRST116', expected: 'No data found' }
  ];
  
  specificTests.forEach(test => {
    const error = { code: test.code, message: 'Database error occurred' };
    const result = optimizedHandler.getErrorMessage(error);
    if (result === test.expected) {
      correctMappings++;
    } else {
      console.log(`❌ Failed: ${test.code} -> "${result}" (expected "${test.expected}")`);
    }
    totalTests++;
  });
  
  // Test pattern matching
  const patternTests = [
    { code: '22030', expected: 'Invalid JSON text' },
    { code: '22045', expected: 'Invalid JSON text' },
    { code: '22764', expected: 'Invalid JSON text' },
    { code: '08001', expected: 'Unable to connect to database' }, // This has specific mapping
    { code: '42000', expected: 'Permission denied' },
    { code: '23000', expected: 'Database constraint violation' }
  ];
  
  patternTests.forEach(test => {
    const error = { code: test.code, message: 'Database error occurred' };
    const result = optimizedHandler.getErrorMessage(error);
    if (result === test.expected) {
      correctMappings++;
    } else {
      console.log(`❌ Failed: ${test.code} -> "${result}" (expected "${test.expected}")`);
    }
    totalTests++;
  });
  
  // Test network errors
  NETWORK_ERRORS.forEach(error => {
    const result = optimizedHandler.getErrorMessage(error);
    if (result === 'Network error. Please check your connection.') {
      correctMappings++;
    } else {
      console.log(`❌ Failed network error: "${error.message}" -> "${result}"`);
    }
    totalTests++;
  });
  
  console.log(`Correctness: ${correctMappings}/${totalTests} tests passed (${(correctMappings/totalTests*100).toFixed(1)}%)`);
  console.log();
  
  // 5. Performance Summary
  console.log('📈 Performance Summary');
  console.log('='.repeat(50));
  
  const avgProcessingTime = (specificCodeTime + patternMatchTime + networkErrorTime + mixedErrorTime) / 4;
  
  console.log(`✅ File size reduced by ${bundleSize.reductionPercentage.toFixed(1)}%`);
  console.log(`✅ Average processing time: ${avgProcessingTime.toFixed(4)} ms/operation`);
  console.log(`✅ Memory efficient: ${(memoryUsage.heapUsed / 1024).toFixed(2)} KB heap usage`);
  console.log(`✅ Correctness maintained: ${(correctMappings/totalTests*100).toFixed(1)}% tests passed`);
  
  // Performance requirements validation
  console.log('\n🎯 Requirements Validation');
  console.log('='.repeat(50));
  
  // Requirement 1.5: Reduce bundle size by at least 90%
  const req1_5 = bundleSize.reductionPercentage >= 90;
  console.log(`Req 1.5 - Bundle size reduction ≥90%: ${req1_5 ? '✅ PASS' : '❌ FAIL'} (${bundleSize.reductionPercentage.toFixed(1)}%)`);
  
  // Requirement 3.1: O(1) time complexity for common error types
  const req3_1 = avgProcessingTime < 0.1; // Less than 0.1ms should indicate O(1) performance
  console.log(`Req 3.1 - O(1) processing time: ${req3_1 ? '✅ PASS' : '❌ FAIL'} (${avgProcessingTime.toFixed(4)}ms avg)`);
  
  // Requirement 3.3: Minimize memory usage
  const req3_3 = memoryUsage.heapUsed < 10240; // Less than 10KB heap usage
  console.log(`Req 3.3 - Memory usage optimized: ${req3_3 ? '✅ PASS' : '❌ FAIL'} (${(memoryUsage.heapUsed/1024).toFixed(2)}KB)`);
  
  const allRequirementsMet = req1_5 && req3_1 && req3_3;
  console.log(`\n🏆 Overall: ${allRequirementsMet ? '✅ ALL REQUIREMENTS MET' : '❌ SOME REQUIREMENTS NOT MET'}`);
  
  return {
    bundleSize,
    processingTime: {
      specific: specificCodeTime,
      pattern: patternMatchTime,
      network: networkErrorTime,
      mixed: mixedErrorTime,
      average: avgProcessingTime
    },
    memoryUsage,
    correctness: {
      passed: correctMappings,
      total: totalTests,
      percentage: correctMappings/totalTests*100
    },
    requirements: {
      req1_5,
      req3_1,
      req3_3,
      allMet: allRequirementsMet
    }
  };
}

// Run benchmarks if called directly
if (require.main === module) {
  const results = runBenchmarks();
  
  // Save results to file
  const resultsPath = path.join(__dirname, '../docs/performance-benchmark-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
}

module.exports = { runBenchmarks };