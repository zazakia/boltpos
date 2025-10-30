# Design Document

## Overview

The current error handler contains over 2800 lines of repetitive error code mappings, with thousands of cases that return identical "Invalid JSON text" messages. This design will replace the bloated switch statement with an efficient, pattern-based error handling system that maintains functionality while dramatically reducing code size and improving maintainability.

## Architecture

### Current Issues
- 2800+ lines of repetitive code
- Thousands of identical error mappings
- Poor maintainability
- Large bundle size impact
- Difficult to extend or modify

### Proposed Solution
- Pattern-based error code matching
- Categorized error handling
- Efficient lookup mechanisms
- Reduced code footprint (target: <100 lines)
- Maintained backward compatibility

## Components and Interfaces

### Core Error Handler Module
```typescript
// Main error processing function
export function getErrorMessage(error: unknown): string

// Supabase-specific error processing
function getSupabaseErrorMessage(error: SupabaseError): string

// Network error detection
function isNetworkError(error: Error): boolean

// Error logging and context handling
export function logError(error: unknown, context?: ErrorContext): void
```

### Error Categories
1. **Database Constraint Errors** (23xxx codes)
2. **Permission Errors** (42xxx codes) 
3. **Data Type Errors** (22xxx codes)
4. **Connection Errors** (08xxx codes)
5. **JSON/Data Format Errors** (2200x-226xx codes)

### Pattern Matching Strategy
Instead of individual case statements, use:
- Regex patterns for error code ranges
- Category-based error mapping
- Default fallback messages
- Specific overrides for important codes

## Data Models

### Error Code Categories
```typescript
interface ErrorCategory {
  pattern: RegExp;
  message: string;
  priority: number;
}

interface SpecificErrorMapping {
  code: string;
  message: string;
}
```

### Error Processing Flow
1. Check for specific error code mappings first
2. Apply category pattern matching
3. Fall back to generic messages
4. Include context information when available

## Error Handling

### Pattern-Based Matching
```typescript
const ERROR_CATEGORIES: ErrorCategory[] = [
  {
    pattern: /^23505$/,
    message: 'This item already exists',
    priority: 1
  },
  {
    pattern: /^23503$/,
    message: 'Cannot delete - item is in use',
    priority: 1
  },
  {
    pattern: /^22[0-9A-F]{3}$/,
    message: 'Invalid data format provided',
    priority: 2
  },
  {
    pattern: /^42[0-9A-F]{3}$/,
    message: 'Permission denied',
    priority: 2
  }
];
```

### Fallback Strategy
- Network errors: "Network error. Please check your connection."
- Unknown Supabase errors: Use error.message if available
- Generic fallback: "An unexpected error occurred"

## Testing Strategy

### Unit Tests
- Test all existing error code mappings still work
- Verify pattern matching accuracy
- Test performance improvements
- Validate backward compatibility

### Integration Tests
- Test with real Supabase errors
- Verify error context preservation
- Test error logging functionality

### Performance Tests
- Measure error processing time
- Compare bundle size before/after
- Memory usage validation

## Implementation Approach

### Phase 1: Analysis
- Extract unique error messages from current implementation
- Identify pattern groups
- Map specific vs. generic error codes

### Phase 2: Refactoring
- Implement pattern-based error categorization
- Create efficient lookup system
- Maintain specific mappings for important codes

### Phase 3: Optimization
- Remove redundant code
- Implement caching if needed
- Optimize for common error paths

### Phase 4: Validation
- Comprehensive testing
- Performance benchmarking
- Bundle size verification

## Expected Outcomes

- **Code Reduction**: From 2800+ lines to <100 lines (96%+ reduction)
- **Bundle Size**: Significant reduction in compiled size
- **Maintainability**: Easy to add new error types
- **Performance**: Faster error processing
- **Compatibility**: No breaking changes to existing functionality