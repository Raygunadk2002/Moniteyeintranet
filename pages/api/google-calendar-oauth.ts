import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// Dynamic redirect URI that handles different ports in development
function getRedirectUri(req: NextApiRequest): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  
  // In development, dynamically construct the redirect URI based on the request
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost:3000';
  
  return `${protocol}://${host}/api/google-calendar-callback`;
}

// Scopes required for calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add aggressive cache-prevention headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Accel-Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Vary', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId } = req.query;

  if (!employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'Employee ID is required' });
  }

  const timestamp = new Date().toISOString();
  console.log('🔐 OAuth request initiated for employee:', {
    employeeId,
    timestamp,
    userAgent: req.headers['user-agent']?.substring(0, 100),
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });

  try {
    // Validate environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('❌ Missing Google OAuth credentials');
      return res.status(500).json({ error: 'OAuth not configured' });
    }

    const redirectUri = getRedirectUri(req);
    console.log('🔄 Using redirect URI:', redirectUri);

    // Initialize OAuth2 client with explicit configuration object
    const oauth2Client = new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: redirectUri
    });

    // Generate ultra-unique state parameter to ensure absolute freshness
    const microTime = process.hrtime.bigint();
    const randomSuffix = Math.random().toString(36).substr(2, 15);
    const uniqueState = `${employeeId}-${Date.now()}-${microTime}-${randomSuffix}`;

    // Generate authorization URL with maximum freshness parameters
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: uniqueState,
      prompt: 'consent select_account', // Force both consent and account selection
      include_granted_scopes: true,
      response_type: 'code',
      hd: 'moniteye.co.uk', // Domain restriction for your organization
      approval_prompt: undefined // Remove deprecated parameter to avoid conflicts
    });

    // Add maximum cache-busting parameters to ensure fresh authorization codes
    const currentTime = Date.now();
    const cacheBusters = [
      `t=${currentTime}`,
      `r=${Math.random().toString(36).substr(2, 16)}`,
      `s=${Math.floor(Math.random() * 10000000)}`,
      `fresh=${new Date().getTime()}`,
      `nocache=${Math.random().toString(16).substr(2, 12)}`,
      `session=${microTime}`,
      `unique=${employeeId}-${currentTime}`,
      `oauth_session=${Date.now()}-${Math.random().toString(36).substr(2, 10)}`
    ];
    
    const separator = authUrl.includes('?') ? '&' : '?';
    const finalAuthUrl = `${authUrl}${separator}${cacheBusters.join('&')}`;

    console.log('✅ Generated ULTRA-FRESH auth URL for employee:', {
      employeeId,
      uniqueState: uniqueState.substring(0, 40) + '...',
      timestamp,
      urlLength: finalAuthUrl.length,
      microTime: microTime.toString(),
      cacheBustersCount: cacheBusters.length
    });
    console.log('🔄 Auth URL scopes:', SCOPES.join(', '));
    console.log('🔄 Maximum cache-busting parameters added:', cacheBusters.length);
    console.log('🚀 Forcing complete session refresh with consent + account selection');
    
    // Direct redirect to Google OAuth with maximum fresh parameters
    res.redirect(307, finalAuthUrl);
  } catch (error) {
    console.error('❌ OAuth initiation error:', error);
    res.status(500).json({ 
      error: 'Failed to initiate OAuth', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 