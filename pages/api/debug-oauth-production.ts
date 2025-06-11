import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// Dynamic redirect URI that handles different environments
function getRedirectUri(req: NextApiRequest): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  
  // Auto-detect protocol and host based on environment
  let protocol = 'http';
  let host = req.headers.host || 'localhost:3000';
  
  // Check for Vercel deployment or other production indicators
  if (req.headers['x-forwarded-proto']) {
    protocol = req.headers['x-forwarded-proto'] as string;
  } else if (req.headers['x-forwarded-ssl'] === 'on') {
    protocol = 'https';
  } else if (host.includes('vercel.app') || host.includes('.app') || host.includes('.com')) {
    protocol = 'https';
  }
  
  return `${protocol}://${host}/api/google-calendar-callback`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dynamicRedirectUri = getRedirectUri(req);
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      host: req.headers.host,
      protocol: req.headers['x-forwarded-proto'] || 'http',
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
      isVercel: !!req.headers['x-vercel-id'],
      vercelRegion: req.headers['x-vercel-deployment-url'],
    },
    oauth: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...' || 'MISSING',
      envRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'NOT_SET',
      dynamicRedirectUri: dynamicRedirectUri,
      secretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0
    },
    supabase: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'MISSING'
    }
  };

  // Test OAuth client creation
  let oauthTest = 'FAILED';
  let testAuthUrl = null;
  
  try {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      const oauth2Client = new google.auth.OAuth2({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: dynamicRedirectUri
      });

      testAuthUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.readonly'],
        state: 'test-debug',
        prompt: 'consent',
        hd: 'moniteye.co.uk'
      });

      oauthTest = 'SUCCESS';
    }
  } catch (error) {
    oauthTest = error instanceof Error ? error.message : 'Unknown error';
  }

  const result = {
    ...debugInfo,
    tests: {
      oauthClientCreation: oauthTest,
      canGenerateAuthUrl: !!testAuthUrl,
      sampleAuthUrl: testAuthUrl?.substring(0, 100) + '...'
    },
    recommendations: [] as string[]
  };

  // Add specific recommendations
  if (!process.env.GOOGLE_CLIENT_ID) {
    result.recommendations.push('❌ Set GOOGLE_CLIENT_ID in Vercel environment variables');
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    result.recommendations.push('❌ Set GOOGLE_CLIENT_SECRET in Vercel environment variables');
  }
  if (!process.env.GOOGLE_REDIRECT_URI && req.headers.host?.includes('vercel')) {
    result.recommendations.push(`❌ Set GOOGLE_REDIRECT_URI to https://${req.headers.host}/api/google-calendar-callback`);
  }
  if (process.env.GOOGLE_REDIRECT_URI?.includes('localhost') && req.headers.host?.includes('vercel')) {
    result.recommendations.push('❌ GOOGLE_REDIRECT_URI is set to localhost but you\'re on Vercel - update to production URL');
  }

  res.status(200).json(result);
} 