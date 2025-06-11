import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    request: {
      host: req.headers.host,
      userAgent: req.headers['user-agent']?.substring(0, 100),
      protocol: req.headers['x-forwarded-proto'] || 'http',
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
  };

  try {
    // Test Supabase connection
    const { data: tokens, error: tokensError } = await supabase
      .from('employee_calendar_tokens')
      .select('employee_id, employee_name, is_active, updated_at')
      .limit(5);

    debugInfo.database = {
      connected: !tokensError,
      error: tokensError?.message,
      tokenCount: tokens?.length || 0,
      activeTokens: tokens?.filter(t => t.is_active).length || 0
    };

  } catch (error) {
    debugInfo.database = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }

  // Add helpful instructions
  const instructions = {
    steps: [
      'Clear browser cache completely (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)',
      'Close all browser tabs/windows',
      'Open a fresh browser window',
      'Navigate to the calendar page',
      'Click "Connect Calendar" for a fresh OAuth flow',
      'Do not refresh or navigate back during the process'
    ],
    troubleshooting: [
      'Each authorization code can only be used once',
      'Authorization codes expire in 10 minutes',
      'The system now tracks used codes to prevent reuse',
      'Use incognito/private browsing to ensure fresh session',
      'Make sure you are using your @moniteye.co.uk Google account'
    ]
  };

  res.status(200).json({
    status: 'OK',
    debug: debugInfo,
    instructions
  });
} 