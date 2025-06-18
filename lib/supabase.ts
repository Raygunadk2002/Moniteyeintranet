import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Client for browser/client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Add timeout and retry logic
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
    },
  },
})

// Admin client for server-side operations (bypasses RLS)
// Always create this, but throw error if service key is missing when actually used
export const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey, // Fallback to anon key for type safety
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: (url, options = {}) => {
        if (!supabaseServiceKey) {
          throw new Error('Supabase service key is required for admin operations')
        }
        return fetch(url, {
          ...options,
          // Add timeout for admin operations
          signal: AbortSignal.timeout(45000), // 45 second timeout for admin operations
        });
      },
    },
  }
)

// Helper function to ensure admin client is available (server-side only)
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not available. This function can only be used server-side.')
  }
  return supabaseAdmin
}

// Helper function for retrying Supabase operations
export async function retrySupabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      console.log(`Supabase operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw lastError!;
}

// Types for our database tables
export interface RevenueData {
  id: number
  month: string
  revenue: number
  year: number
  month_number: number
  invoice_count: number
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: number
  invoice_date: string
  amount: number
  description?: string
  month_reference: string
  upload_batch_id?: string
  created_at: string
}

export interface UploadBatch {
  id: string
  filename?: string
  total_invoices: number
  total_amount: number
  months_generated: number
  date_range_start: string
  date_range_end: string
  created_at: string
} 