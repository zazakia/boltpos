import { getErrorMessage, ErrorContext, SupabaseError } from '../errorHandler';

// Mock Supabase error objects based on real Supabase error structures
const createSupabaseError = (code: string, message: string, details?: string, hint?: string): SupabaseError & Error => {
  const error = new Error(message) as SupabaseError & Error;
  error.code = code;
  error.details = details;
  error.hint = hint;
  return error;
};

// Real Supabase error response structure
const createSupabaseResponse = (error: SupabaseError) => ({
  data: null,
  error,
  count: null,
  status: 400,
  statusText: 'Bad Request'
});

// Network error that might occur with Supabase
const createNetworkError = (message: string) => {
  const error = new Error(message);
  error.name = 'TypeError';
  return error;
};

describe('Error Handler', () => {
  describe('getErrorMessage', () => {
    it('should handle string errors', () => {
      const result = getErrorMessage('Test error message');
      expect(result).toBe('Test error message');
    });

    it('should handle null/undefined errors', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const result = getErrorMessage(error);
      expect(result).toBe('Test error');
    });

    it('should handle objects with message property', () => {
      const error = { message: 'Object error message' };
      const result = getErrorMessage(error);
      expect(result).toBe('Object error message');
    });

    it('should handle Supabase error structure', () => {
      const error = {
        error: {
          message: 'Supabase error',
          code: '23505'
        }
      };
      const result = getErrorMessage(error);
      expect(result).toBe('This item already exists');
    });

    it('should handle network errors', () => {
      const networkError = new Error('fetch failed');
      const result = getErrorMessage(networkError);
      expect(result).toBe('Network error. Please check your connection.');
    });

    it('should handle Supabase errors with specific codes', () => {
      const supabaseError = new Error('Original message') as any;
      supabaseError.code = '23503';
      const result = getErrorMessage(supabaseError);
      expect(result).toBe('Cannot delete - item is in use');
    });

    it('should handle unknown error types', () => {
      const result = getErrorMessage(123);
      expect(result).toBe('An unexpected error occurred');
    });
  });

  describe('Pattern Matching', () => {
    describe('Specific Error Code Mappings', () => {
      it('should map specific error codes correctly', () => {
        const testCases = [
          { code: 'PGRST116', expected: 'No data found' },
          { code: '23505', expected: 'This item already exists' },
          { code: '23503', expected: 'Cannot delete - item is in use' },
          { code: '42501', expected: 'Permission denied' },
          { code: '23514', expected: 'Invalid data provided' },
          { code: '28P01', expected: 'Database connection failed' },
          { code: '42P01', expected: 'Table not found' },
          { code: '42703', expected: 'Column not found' },
          { code: '22001', expected: 'Data too long' },
          { code: '22003', expected: 'Number out of range' },
          { code: '22P02', expected: 'Invalid input format' },
          { code: '23502', expected: 'Required field is missing' },
        ];

        testCases.forEach(({ code, expected }) => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe(expected);
        });
      });
    });

    describe('JSON/Data Format Error Pattern (22[0-7]xx)', () => {
      it('should match JSON format error codes and return "Invalid JSON text"', () => {
        const jsonErrorCodes = [
          '22030', '22031', '22032', '22033', '22034', '22035',
          '22100', '22200', '22300', '22400', '22500', '22600', '22700',
          '2203A', '2203F', '22050', '22060', '22070', '22701', '22702'
        ];

        jsonErrorCodes.forEach(code => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe('Invalid JSON text');
        });
      });

      it('should not match codes outside the 22[0-7]xx range', () => {
        const nonJsonCodes = ['22800', '22900', '229FF', '22A00', '22B00'];
        
        nonJsonCodes.forEach(code => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).not.toBe('Invalid JSON text');
        });
      });
    });

    describe('General Data Type Error Pattern (22xxx)', () => {
      it('should match general data type error codes that do not match JSON pattern', () => {
        const dataTypeErrorCodes = [
          '22800', '22900', '22A00', '22B00', '22C00', 
          '22D00', '22E00', '22F00'
        ];

        dataTypeErrorCodes.forEach(code => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe('Invalid data format');
        });
      });

      it('should handle codes with specific mappings that override pattern', () => {
        const specificMappings = [
          { code: '22001', expected: 'Data too long' },
          { code: '22003', expected: 'Number out of range' },
          { code: '22P02', expected: 'Invalid input format' },
          { code: '2200F', expected: 'Invalid JSON data' },
          { code: '2200G', expected: 'Invalid JSON text' },
          { code: '2200H', expected: 'Invalid JSON value' }
        ];

        specificMappings.forEach(({ code, expected }) => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe(expected);
        });
      });
    });

    describe('Connection Error Pattern (08xxx)', () => {
      it('should match connection error codes that do not have specific mappings', () => {
        const connectionErrorCodes = [
          '08000', '08007', '0800A', '0800B', '0800C', '0800D'
        ];

        connectionErrorCodes.forEach(code => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe('Database connection error');
        });
      });

      it('should handle connection codes with specific mappings', () => {
        const specificMappings = [
          { code: '08006', expected: 'Connection failed' },
          { code: '08001', expected: 'Unable to connect to database' },
          { code: '08004', expected: 'Connection rejected' },
          { code: '08003', expected: 'Connection does not exist' }
        ];

        specificMappings.forEach(({ code, expected }) => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe(expected);
        });
      });
    });

    describe('Permission Error Pattern (42xxx)', () => {
      it('should match permission error codes that do not have specific mappings', () => {
        const permissionErrorCodes = [
          '42000', '42601', '42602', '42622', '42723', 
          '42809', '42883', '42939'
        ];

        permissionErrorCodes.forEach(code => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe('Permission denied');
        });
      });

      it('should handle permission codes with specific mappings', () => {
        const specificMappings = [
          { code: '42501', expected: 'Permission denied' },
          { code: '42P01', expected: 'Table not found' },
          { code: '42703', expected: 'Column not found' }
        ];

        specificMappings.forEach(({ code, expected }) => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe(expected);
        });
      });
    });

    describe('Constraint Error Pattern (23xxx)', () => {
      it('should match constraint error codes that do not have specific mappings', () => {
        const constraintErrorCodes = [
          '23000', '23001', '23512', '23513', '23515'
        ];

        constraintErrorCodes.forEach(code => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe('Database constraint violation');
        });
      });

      it('should handle constraint codes with specific mappings', () => {
        const specificMappings = [
          { code: '23505', expected: 'This item already exists' },
          { code: '23503', expected: 'Cannot delete - item is in use' },
          { code: '23514', expected: 'Invalid data provided' },
          { code: '23502', expected: 'Required field is missing' },
          { code: '23511', expected: 'Check constraint violated' },
          { code: '23P01', expected: 'Exclusion constraint violated' }
        ];

        specificMappings.forEach(({ code, expected }) => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe(expected);
        });
      });
    });

    describe('Pattern Priority and Edge Cases', () => {
      it('should prioritize specific mappings over pattern matching', () => {
        // These codes have specific mappings that should override pattern matching
        const specificOverrides = [
          { code: '23505', expected: 'This item already exists' }, // Not generic constraint message
          { code: '23503', expected: 'Cannot delete - item is in use' }, // Not generic constraint message
          { code: '22001', expected: 'Data too long' }, // Not generic data format message
          { code: '08001', expected: 'Unable to connect to database' }, // Not generic connection message
        ];

        specificOverrides.forEach(({ code, expected }) => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe(expected);
        });
      });

      it('should handle edge case error codes', () => {
        const edgeCases = [
          { code: '', expected: 'Original message' }, // Falls back to message
          { code: null, expected: 'Original message' }, // Falls back to message
          { code: undefined, expected: 'Original message' }, // Falls back to message
          { code: '99999', expected: 'Original message' }, // No pattern match, falls back
          { code: 'INVALID', expected: 'Original message' }, // No pattern match, falls back
        ];

        edgeCases.forEach(({ code, expected }) => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe(expected);
        });
      });

      it('should handle edge cases without original message', () => {
        const error = new Error() as any; // No message
        error.code = '99999'; // No pattern match
        const result = getErrorMessage(error);
        expect(result).toBe('Database error occurred');
      });

      it('should handle boundary conditions for pattern ranges', () => {
        const boundaryCases = [
          // JSON pattern boundaries (22[0-7]xx)
          { code: '2202F', expected: 'Invalid JSON text' }, // Within range
          { code: '22800', expected: 'Invalid data format' }, // Outside range, falls to general pattern
          { code: '2202E', expected: 'Invalid JSON text' }, // Within range
          
          // Hex digit boundaries
          { code: '2203A', expected: 'Invalid JSON text' }, // Hex A
          { code: '2203F', expected: 'Invalid JSON text' }, // Hex F
          { code: '22030', expected: 'Invalid JSON text' }, // Lower boundary
          { code: '22700', expected: 'Invalid JSON text' }, // Upper boundary
          { code: '22701', expected: 'Invalid JSON text' }, // Still within range
          { code: '227FF', expected: 'Invalid JSON text' }, // Still within range
        ];

        boundaryCases.forEach(({ code, expected }) => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe(expected);
        });
      });

      it('should handle case sensitivity in error codes', () => {
        const caseCases = [
          { code: '2203A', expected: 'Invalid JSON text' }, // uppercase hex
          { code: '42P01', expected: 'Table not found' }, // uppercase (specific mapping)
          { code: '42000', expected: 'Permission denied' }, // pattern match
        ];

        caseCases.forEach(({ code, expected }) => {
          const error = new Error('Original message') as any;
          error.code = code;
          const result = getErrorMessage(error);
          expect(result).toBe(expected);
        });
      });

      it('should handle lowercase hex codes that do not match patterns', () => {
        // Lowercase hex codes that don't match the uppercase patterns
        const error = new Error('Original message') as any;
        error.code = '2203a'; // lowercase, won't match pattern
        const result = getErrorMessage(error);
        expect(result).toBe('Original message'); // Falls back to original message
      });

      it('should fallback to original message when no pattern matches', () => {
        const error = new Error('Custom error message') as any;
        error.code = '99999'; // No pattern match
        const result = getErrorMessage(error);
        expect(result).toBe('Custom error message');
      });

      it('should handle Supabase error objects without codes', () => {
        const error = {
          error: {
            message: 'Error without code'
          }
        };
        const result = getErrorMessage(error);
        expect(result).toBe('Error without code');
      });
    });
  });

  describe('Integration Tests with Real Supabase Errors', () => {
    describe('Real Supabase Error Objects', () => {
      it('should handle real Supabase constraint violation errors', () => {
        const duplicateKeyError = createSupabaseError(
          '23505',
          'duplicate key value violates unique constraint "products_name_key"',
          'Key (name)=(Test Product) already exists.',
          'Consider using a different name or updating the existing record.'
        );

        const result = getErrorMessage(duplicateKeyError);
        expect(result).toBe('This item already exists');
      });

      it('should handle real Supabase foreign key constraint errors', () => {
        const foreignKeyError = createSupabaseError(
          '23503',
          'update or delete on table "categories" violates foreign key constraint "products_category_id_fkey" on table "products"',
          'Key (id)=(123) is still referenced from table "products".',
          'Remove or update the referencing rows first.'
        );

        const result = getErrorMessage(foreignKeyError);
        expect(result).toBe('Cannot delete - item is in use');
      });

      it('should handle real Supabase permission errors', () => {
        const permissionError = createSupabaseError(
          '42501',
          'permission denied for table products',
          'User does not have SELECT permission on table products',
          'Check your Row Level Security policies'
        );

        const result = getErrorMessage(permissionError);
        expect(result).toBe('Permission denied');
      });

      it('should handle real Supabase JSON format errors', () => {
        const jsonError = createSupabaseError(
          '22030',
          'invalid input syntax for type json',
          'Invalid JSON format in column data',
          'Ensure the JSON data is properly formatted'
        );

        const result = getErrorMessage(jsonError);
        expect(result).toBe('Invalid JSON text');
      });

      it('should handle real Supabase connection errors', () => {
        const connectionError = createSupabaseError(
          '08006',
          'connection_failure',
          'Could not connect to database server',
          'Check your network connection and database availability'
        );

        const result = getErrorMessage(connectionError);
        expect(result).toBe('Connection failed');
      });

      it('should handle real Supabase table not found errors', () => {
        const tableError = createSupabaseError(
          '42P01',
          'relation "nonexistent_table" does not exist',
          'The table you are trying to access does not exist',
          'Check the table name and ensure it exists in the database'
        );

        const result = getErrorMessage(tableError);
        expect(result).toBe('Table not found');
      });
    });

    describe('Real Supabase Response Structures', () => {
      it('should handle Supabase response with error object', () => {
        const error = createSupabaseError('23505', 'duplicate key violation');
        const response = createSupabaseResponse(error);

        const result = getErrorMessage(response.error);
        expect(result).toBe('This item already exists');
      });

      it('should handle nested Supabase error structure', () => {
        const nestedError = {
          error: createSupabaseError('23503', 'foreign key constraint violation')
        };

        const result = getErrorMessage(nestedError);
        expect(result).toBe('Cannot delete - item is in use');
      });

      it('should handle Supabase error with additional context', () => {
        const baseError = createSupabaseError('42501', 'permission denied');
        const errorWithContext = Object.assign(baseError, {
          statusCode: 403,
          statusText: 'Forbidden'
        });

        const result = getErrorMessage(errorWithContext);
        expect(result).toBe('Permission denied');
      });
    });

    describe('Network and Connection Integration', () => {
      it('should handle real network errors that occur with Supabase', () => {
        const networkErrors = [
          createNetworkError('fetch failed'),
          createNetworkError('network request failed'),
          createNetworkError('connection refused'),
          createNetworkError('timeout of 10000ms exceeded'),
          createNetworkError('unable to connect to server')
        ];

        networkErrors.forEach(error => {
          const result = getErrorMessage(error);
          expect(result).toBe('Network error. Please check your connection.');
        });
      });

      it('should handle Supabase timeout errors', () => {
        const timeoutError = createSupabaseError(
          '08001',
          'timeout expired',
          'Connection timeout while connecting to database',
          'Try again or check your network connection'
        );

        const result = getErrorMessage(timeoutError);
        expect(result).toBe('Unable to connect to database');
      });
    });

    describe('Backward Compatibility', () => {
      it('should maintain compatibility with legacy error handling patterns', () => {
        // Test that old error handling patterns still work
        const legacyErrorFormats = [
          // Old string-based errors
          'Database connection failed',
          
          // Old Error objects without codes
          new Error('Something went wrong'),
          
          // Old object-based errors
          { message: 'Legacy error format' },
          
          // Old nested error structures
          { error: { message: 'Nested legacy error' } }
        ];

        const expectedResults = [
          'Database connection failed',
          'Something went wrong',
          'Legacy error format',
          'Nested legacy error'
        ];

        legacyErrorFormats.forEach((error, index) => {
          const result = getErrorMessage(error);
          expect(result).toBe(expectedResults[index]);
        });
      });

      it('should handle mixed error formats in the same application', () => {
        // Simulate a scenario where both old and new error formats might be present
        const mixedErrors = [
          // New Supabase error
          createSupabaseError('23505', 'duplicate key'),
          
          // Legacy string error
          'Old error message',
          
          // Legacy Error object
          new Error('Legacy error object'),
          
          // New network error
          createNetworkError('fetch failed')
        ];

        const results = mixedErrors.map(error => getErrorMessage(error));
        
        expect(results[0]).toBe('This item already exists'); // New format
        expect(results[1]).toBe('Old error message'); // Legacy string
        expect(results[2]).toBe('Legacy error object'); // Legacy Error
        expect(results[3]).toBe('Network error. Please check your connection.'); // New network handling
      });

      it('should preserve original behavior for unmapped error codes', () => {
        // Test that unmapped codes fall back to original message (backward compatible)
        const unmappedError = createSupabaseError(
          '99999',
          'Original Supabase error message',
          'Some details',
          'Some hint'
        );

        const result = getErrorMessage(unmappedError);
        expect(result).toBe('Original Supabase error message');
      });
    });

    describe('Error Context Preservation', () => {
      it('should preserve error details and hints from Supabase errors', () => {
        const errorWithDetails = createSupabaseError(
          '23505',
          'duplicate key value violates unique constraint',
          'Key (email)=(test@example.com) already exists.',
          'Use a different email address or update the existing record.'
        );

        // The function should still return the mapped message, but the original error object
        // should preserve all context information for logging purposes
        const result = getErrorMessage(errorWithDetails);
        expect(result).toBe('This item already exists');
        
        // Verify that the original error object still contains all context
        expect(errorWithDetails.details).toBe('Key (email)=(test@example.com) already exists.');
        expect(errorWithDetails.hint).toBe('Use a different email address or update the existing record.');
        expect(errorWithDetails.message).toBe('duplicate key value violates unique constraint');
      });

      it('should handle errors without details or hints gracefully', () => {
        const minimalError = createSupabaseError('23505', 'duplicate key');
        
        const result = getErrorMessage(minimalError);
        expect(result).toBe('This item already exists');
        
        // Should not throw when accessing undefined properties
        expect(minimalError.details).toBeUndefined();
        expect(minimalError.hint).toBeUndefined();
      });

      it('should preserve context in nested error structures', () => {
        const nestedErrorWithContext = {
          error: createSupabaseError(
            '42501',
            'permission denied for relation products',
            'User lacks SELECT permission',
            'Contact your administrator to grant proper permissions'
          ),
          status: 403,
          statusText: 'Forbidden'
        };

        const result = getErrorMessage(nestedErrorWithContext);
        expect(result).toBe('Permission denied');
        
        // Verify context is preserved in the nested structure
        expect(nestedErrorWithContext.error.details).toBe('User lacks SELECT permission');
        expect(nestedErrorWithContext.error.hint).toBe('Contact your administrator to grant proper permissions');
        expect(nestedErrorWithContext.status).toBe(403);
      });

      it('should handle complex error objects with additional metadata', () => {
        const baseError = createSupabaseError('23503', 'foreign key constraint violation');
        const complexError = Object.assign(baseError, {
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'req_123456',
          userId: 'user_789',
          operation: 'DELETE',
          table: 'categories'
        });

        const result = getErrorMessage(complexError);
        expect(result).toBe('Cannot delete - item is in use');
        
        // Verify all metadata is preserved
        expect(complexError.timestamp).toBe('2024-01-01T00:00:00Z');
        expect(complexError.requestId).toBe('req_123456');
        expect(complexError.userId).toBe('user_789');
        expect(complexError.operation).toBe('DELETE');
        expect(complexError.table).toBe('categories');
      });

      it('should preserve error context for logging while returning user-friendly messages', () => {
        const errorForLogging = createSupabaseError(
          '22001',
          'value too long for type character varying(50)',
          'The input value exceeds the maximum length of 50 characters',
          'Reduce the length of your input or increase the column size'
        );

        // Should return user-friendly message
        const userMessage = getErrorMessage(errorForLogging);
        expect(userMessage).toBe('Data too long');
        
        // But preserve technical details for logging
        expect(errorForLogging.message).toBe('value too long for type character varying(50)');
        expect(errorForLogging.details).toBe('The input value exceeds the maximum length of 50 characters');
        expect(errorForLogging.hint).toBe('Reduce the length of your input or increase the column size');
      });
    });

    describe('Real-world Supabase Scenarios', () => {
      it('should handle authentication errors from Supabase Auth', () => {
        const authError = createSupabaseError(
          'invalid_credentials',
          'Invalid login credentials',
          'Email or password is incorrect',
          'Check your email and password and try again'
        );

        const result = getErrorMessage(authError);
        // Should fall back to original message since this isn't a database error code
        expect(result).toBe('Invalid login credentials');
      });

      it('should handle RLS (Row Level Security) policy violations', () => {
        const rlsError = createSupabaseError(
          '42501',
          'new row violates row-level security policy for table "products"',
          'Row-level security policy prevents this operation',
          'Ensure you have the required permissions for this operation'
        );

        const result = getErrorMessage(rlsError);
        expect(result).toBe('Permission denied');
      });

      it('should handle Supabase storage errors', () => {
        const storageError = {
          error: createSupabaseError(
            'storage_error',
            'File upload failed',
            'File size exceeds maximum allowed size',
            'Reduce file size and try again'
          )
        };

        const result = getErrorMessage(storageError);
        expect(result).toBe('File upload failed');
      });

      it('should handle Supabase realtime subscription errors', () => {
        const realtimeError = createSupabaseError(
          'subscription_error',
          'Failed to establish realtime connection',
          'WebSocket connection failed',
          'Check your network connection and try again'
        );

        const result = getErrorMessage(realtimeError);
        expect(result).toBe('Failed to establish realtime connection');
      });

      it('should handle database function errors', () => {
        const functionError = createSupabaseError(
          '42883',
          'function process_order(uuid, jsonb) does not exist',
          'The database function you are trying to call does not exist',
          'Check the function name and parameters'
        );

        const result = getErrorMessage(functionError);
        expect(result).toBe('Permission denied'); // Falls under 42xxx pattern
      });
    });
  });
});