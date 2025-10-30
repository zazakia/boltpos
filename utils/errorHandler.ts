export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalInfo?: Record<string, any>;
}

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

const SPECIFIC_MAPPINGS: Record<string, string> = {
  'PGRST116': 'No data found', '23505': 'This item already exists', '23503': 'Cannot delete - item is in use',
  '42501': 'Permission denied', '23514': 'Invalid data provided', '28P01': 'Database connection failed',
  '42P01': 'Table not found', '42703': 'Column not found', '22001': 'Data too long', '22003': 'Number out of range',
  '22P02': 'Invalid input format', '23502': 'Required field is missing', '23511': 'Check constraint violated',
  '23P01': 'Exclusion constraint violated', '2BP01': 'Dependent objects still exist', '0A000': 'Feature not supported',
  '08006': 'Connection failed', '08001': 'Unable to connect to database', '08004': 'Connection rejected',
  '08003': 'Connection does not exist', '0P000': 'Invalid role specification', '0L000': 'Invalid grantor',
  '0LP01': 'Invalid grant operation', '0Z002': 'Invalid XML document', '2200F': 'Invalid JSON data',
  '2200G': 'Invalid JSON text', '2200H': 'Invalid JSON value',
};

const ERROR_PATTERNS = [
  { pattern: /^22[0-7][0-9A-F]{2}$/, message: 'Invalid JSON text' },
  { pattern: /^22[0-9A-F]{3}$/, message: 'Invalid data format' },
  { pattern: /^08[0-9A-F]{3}$/, message: 'Database connection error' },
  { pattern: /^42[0-9A-F]{3}$/, message: 'Permission denied' },
  { pattern: /^23[0-9A-F]{3}$/, message: 'Database constraint violation' }
];

function isNetworkError(error: Error): boolean {
  const msg = error.message?.toLowerCase() || '';
  return ['network error', 'fetch failed', 'connection refused', 'timeout', 'network request failed', 'unable to connect']
    .some(pattern => msg.includes(pattern));
}

function getSupabaseErrorMessage(error: SupabaseError): string {
  const { code, message } = error;
  if (!code) return message || 'Database error occurred';
  if (SPECIFIC_MAPPINGS[code]) return SPECIFIC_MAPPINGS[code];
  for (const { pattern, message: msg } of ERROR_PATTERNS) {
    if (pattern.test(code)) return msg;
  }
  return message || 'Database error occurred';
}

export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred';
  if (typeof error === 'string') return error;
  
  if (error instanceof Error) {
    if ('code' in error && typeof error.code === 'string') {
      return getSupabaseErrorMessage(error as SupabaseError);
    }
    if (isNetworkError(error)) return 'Network error. Please check your connection.';
    return error.message || 'An unexpected error occurred';
  }
  
  if (typeof error === 'object' && error !== null) {
    if ('message' in error) return String(error.message);
    if ('error' in error) {
      const supabaseError = (error as any).error;
      if (typeof supabaseError === 'object' && supabaseError !== null) {
        return getSupabaseErrorMessage(supabaseError);
      }
    }
  }
  
  return 'An unexpected error occurred';
}