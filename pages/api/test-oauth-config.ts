import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasRedirectUri = !!process.env.GOOGLE_REDIRECT_URI;

    // Get redirect URI
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const dynamicRedirectUri = `${protocol}://${host}/api/google-calendar-callback`;

    // Test OAuth client creation
    let oauthClientTest = null;
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || dynamicRedirectUri
      );
      oauthClientTest = 'Success';
    } catch (error) {
      oauthClientTest = error instanceof Error ? error.message : 'Failed';
    }

    // Generate a test auth URL (without redirecting)
    let testAuthUrl = null;
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || dynamicRedirectUri
      );

      testAuthUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.readonly'],
        state: 'test-state',
        prompt: 'consent',
        hd: 'moniteye.co.uk'
      });
    } catch (error) {
      testAuthUrl = error instanceof Error ? error.message : 'Failed to generate';
    }

    const response = {
      status: 'OAuth Configuration Test',
      timestamp: new Date().toISOString(),
      environment: {
        hasClientId,
        hasClientSecret,
        hasRedirectUri,
        clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
        clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        dynamicRedirectUri
      },
      tests: {
        oauthClientCreation: oauthClientTest,
        authUrlGeneration: testAuthUrl ? 'Success' : 'Failed',
        testAuthUrl: testAuthUrl?.substring(0, 100) + '...' // Show first 100 chars
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('OAuth config test error:', error);
    res.status(500).json({
      error: 'OAuth configuration test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 