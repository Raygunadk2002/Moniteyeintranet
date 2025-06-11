import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// In-memory store for used authorization codes with timestamp tracking
interface UsedCode {
  timestamp: number;
  attempts: number;
}

const usedAuthCodes = new Map<string, UsedCode>();

// Clean up old codes every 5 minutes (codes expire in 10 minutes)
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  let cleaned = 0;
  const keysToDelete: string[] = [];
  
  usedAuthCodes.forEach((data, code) => {
    if (data.timestamp < fiveMinutesAgo) {
      keysToDelete.push(code);
    }
  });
  
  keysToDelete.forEach(code => {
    usedAuthCodes.delete(code);
    cleaned++;
  });
  
  console.log(`🧹 Cleaned ${cleaned} expired authorization codes from cache, ${usedAuthCodes.size} remaining`);
}, 5 * 60 * 1000);

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

// Initialize Supabase client for storing tokens
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Employee mapping to get proper names
const EMPLOYEE_MAPPING: { [key: string]: string } = {
  'alex-keal': 'Alex Keal',
  'mark-nockles': 'Mark Nockles', 
  'richard-booth': 'Richard Booth'
};

// Function to extract employee ID from unique state parameter
function extractEmployeeId(state: string): string {
  // New state format: employeeId-timestamp-microTime-randomString
  // Old state format: employeeId-timestamp-randomString
  const parts = state.split('-');
  if (parts.length >= 3) {
    return parts[0]; // Return the employee ID part (always first)
  }
  return state; // Fallback to original state if format doesn't match
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  const startISOTime = new Date().toISOString();
  
  console.log(`🚀 [${requestId}] OAuth callback started at ${startISOTime}`);
  console.log(`🔍 [${requestId}] Full request URL: ${req.url}`);
  console.log(`🔍 [${requestId}] Request headers:`, {
    host: req.headers.host,
    referer: req.headers.referer,
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-real-ip': req.headers['x-real-ip']
  });

  if (req.method !== 'GET') {
    console.log(`❌ [${requestId}] Invalid method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: oauthError } = req.query;
  console.log(`🔍 [${requestId}] Query parameters:`, {
    code: code ? `${String(code).substring(0, 20)}...` : 'missing',
    state: state || 'missing',
    oauthError: oauthError || 'none',
    allParams: Object.keys(req.query)
  });

  // OAuth error handling
  if (oauthError) {
    console.log(`❌ [${requestId}] OAuth error from Google:`, oauthError);
    return res.redirect(`/calendar?error=${encodeURIComponent(String(oauthError))}&debug=OAuth%20error%20from%20Google`);
  }

  if (!code || !state) {
    console.log(`❌ [${requestId}] Missing required parameters - code: ${!!code}, state: ${!!state}`);
    return res.redirect('/calendar?error=Missing%20authorization%20code%20or%20state&debug=Required%20OAuth%20parameters%20missing');
  }

  // Parse state
  let employeeId: string;
  let timestamp: number;
  try {
    const stateStr = String(state);
    console.log(`🔍 [${requestId}] Parsing state: ${stateStr}`);
    const parts = stateStr.split('-');
    if (parts.length < 4) {
      throw new Error(`Invalid state format: ${stateStr}`);
    }
    
    // Handle employee IDs that may contain hyphens
    // State format: employeeId-timestamp-microsecond-randomSuffix
    // We need to find the timestamp part (should be a valid number around 13 digits)
    let timestampIndex = -1;
    for (let i = 1; i < parts.length - 2; i++) {
      const potentialTimestamp = parseInt(parts[i]);
      // Check if it looks like a timestamp (13 digits, reasonable range)
      if (!isNaN(potentialTimestamp) && 
          parts[i].length >= 13 && 
          potentialTimestamp > 1600000000000 && // After year 2020
          potentialTimestamp < 2000000000000) {  // Before year 2033
        timestampIndex = i;
        break;
      }
    }
    
    if (timestampIndex === -1) {
      throw new Error(`Could not find valid timestamp in state: ${stateStr}`);
    }
    
    // Reconstruct employee ID (everything before timestamp)
    employeeId = parts.slice(0, timestampIndex).join('-');
    timestamp = parseInt(parts[timestampIndex]);
    
    console.log(`🔍 [${requestId}] State parsing results:`, {
      employeeId,
      timestamp,
      timestampValid: !isNaN(timestamp) && timestamp > 0,
      parts: parts.length,
      timestampIndex,
      allParts: parts
    });
    
    // Validate timestamp
    if (isNaN(timestamp) || timestamp <= 0) {
      throw new Error(`Invalid timestamp in state: ${parts[timestampIndex]}`);
    }
    
    // Calculate OAuth flow timing
    const now = Date.now();
    const oauthFlowDuration = now - timestamp;
    const oauthStartTime = new Date(timestamp).toISOString();
    
    console.log(`⏱️ [${requestId}] OAuth flow timing:`, {
      started: oauthStartTime,
      duration: `${oauthFlowDuration}ms`,
      durationSeconds: `${(oauthFlowDuration / 1000).toFixed(2)}s`,
      isExpired: oauthFlowDuration > 600000, // 10 minutes
      warningThreshold: oauthFlowDuration > 300000 // 5 minutes
    });
    
    if (oauthFlowDuration > 600000) {
      console.log(`⚠️ [${requestId}] OAuth flow took longer than 10 minutes - this may cause invalid_grant`);
    }
    
  } catch (error) {
    console.log(`❌ [${requestId}] Error parsing state:`, error);
    return res.redirect('/calendar?error=Invalid%20state%20parameter&debug=State%20parsing%20failed');
  }

  console.log(`👤 [${requestId}] Processing OAuth for employee: ${employeeId}`);

  // Code reuse detection with enhanced logging
  const codeStr = String(code);
  const codeKey = `oauth_code_${codeStr.substring(0, 10)}`;
  const isCodeUsed = usedAuthCodes.has(codeKey);
  const attempts = (usedAuthCodes.get(codeKey)?.attempts || 0) + 1;
  
  console.log(`🔍 [${requestId}] Code analysis:`, {
    codePrefix: codeStr.substring(0, 20),
    codeLength: codeStr.length,
    codePattern: /^[0-9]\/[0-9A-Za-z_-]+$/.test(codeStr) ? 'valid_format' : 'invalid_format',
    isUsed: isCodeUsed,
    attempts: attempts,
    cacheSize: usedAuthCodes.size,
    cacheKeys: Array.from(usedAuthCodes.keys()).slice(0, 3)
  });

  if (isCodeUsed) {
    console.log(`❌ [${requestId}] CODE REUSE DETECTED - code has been used ${attempts} times`);
    return res.redirect('/calendar?error=Authorization%20code%20already%20used&debug=Code%20reuse%20detected');
  }

  // Mark code as used immediately
  usedAuthCodes.set(codeKey, { timestamp: Date.now(), attempts });

  // Enhanced Google OAuth configuration - explicitly disable PKCE
  const redirectUri = getRedirectUri(req);
  const oauth2Client = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: redirectUri
  });

  const configInfo = {
    clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
    hasSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: redirectUri,
    requestHost: req.headers.host,
    protocol: req.headers['x-forwarded-proto'] || 'http'
  };
  
  console.log(`🔧 [${requestId}] OAuth configuration:`, configInfo);

  try {
    console.log(`🔄 [${requestId}] Attempting token exchange with Google...`);
    const tokenExchangeStart = Date.now();
    
    // Bypass googleapis library and make direct token exchange request to avoid PKCE
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      code: codeStr,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
      // Explicitly NOT including any PKCE parameters like code_verifier
    });

    console.log(`🔧 [${requestId}] Direct token exchange parameters:`, {
      url: tokenUrl,
      hasCode: !!codeStr,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: redirectUri,
      grantType: 'authorization_code'
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.log(`❌ [${requestId}] Token exchange failed:`, {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData: errorData
      });
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorData}`);
    }

    const rawTokens = await tokenResponse.json();
    
    const tokenExchangeDuration = Date.now() - tokenExchangeStart;
    console.log(`✅ [${requestId}] Token exchange successful in ${tokenExchangeDuration}ms`);
    console.log(`🔍 [${requestId}] Raw token details:`, {
      hasAccessToken: !!rawTokens.access_token,
      hasRefreshToken: !!rawTokens.refresh_token,
      tokenType: rawTokens.token_type,
      expiresIn: rawTokens.expires_in,
      scope: rawTokens.scope
    });

    if (!rawTokens.access_token) {
      throw new Error('No access token received from Google');
    }

    // Convert direct OAuth response to googleapis format
    const tokens = {
      access_token: rawTokens.access_token,
      refresh_token: rawTokens.refresh_token,
      token_type: rawTokens.token_type,
      expiry_date: rawTokens.expires_in ? Date.now() + (rawTokens.expires_in * 1000) : undefined,
      scope: rawTokens.scope
    };

    console.log(`🔄 [${requestId}] Converted tokens for googleapis:`, {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      tokenType: tokens.token_type,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'no_expiry',
      scope: tokens.scope
    });

    oauth2Client.setCredentials(tokens);

    // Get user info with timing
    console.log(`👤 [${requestId}] Fetching user information...`);
    const userInfoStart = Date.now();
    
    const oauth2Service = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2Service.userinfo.get();
    
    const userInfoDuration = Date.now() - userInfoStart;
    console.log(`✅ [${requestId}] User info fetched in ${userInfoDuration}ms`);
    console.log(`🔍 [${requestId}] User details:`, {
      email: userInfo.data.email,
      domain: userInfo.data.email?.split('@')[1],
      name: userInfo.data.name,
      verified: userInfo.data.verified_email
    });

    // Domain verification
    const userEmail = userInfo.data.email;
    if (!userEmail?.endsWith('@moniteye.co.uk')) {
      console.log(`❌ [${requestId}] DOMAIN VERIFICATION FAILED - expected @moniteye.co.uk, got ${userEmail}`);
      return res.redirect('/calendar?error=Please%20use%20your%20moniteye.co.uk%20email%20address&debug=Domain%20verification%20failed');
    }

    // Database operations with timing
    console.log(`💾 [${requestId}] Saving tokens to database...`);
    const dbStart = Date.now();
    
    const { error: dbError } = await supabase
      .from('employee_calendar_tokens')
      .upsert({
        employee_id: employeeId,
        employee_name: userInfo.data.name,
        google_email: userEmail,
        google_name: userInfo.data.name,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token || null,
        google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        is_active: true,
        updated_at: new Date().toISOString()
      });

    const dbDuration = Date.now() - dbStart;
    
    if (dbError) {
      console.log(`❌ [${requestId}] Database error after ${dbDuration}ms:`, dbError);
      throw dbError;
    }

    console.log(`✅ [${requestId}] Database update successful in ${dbDuration}ms`);

    // Final success logging
    const totalDuration = Date.now() - startTime;
    console.log(`🎉 [${requestId}] OAuth flow completed successfully in ${totalDuration}ms`);
    console.log(`📊 [${requestId}] Performance breakdown:`, {
      tokenExchange: `${tokenExchangeDuration}ms`,
      userInfo: `${userInfoDuration}ms`,
      database: `${dbDuration}ms`,
      total: `${totalDuration}ms`
    });

    return res.redirect('/calendar?success=Calendar%20connected%20successfully');

  } catch (error: any) {
    const errorDuration = Date.now() - startTime;
    const isInvalidGrant = error?.message?.includes('invalid_grant') || 
                          error?.response?.status === 400 ||
                          error?.code === 400;

    console.log(`❌ [${requestId}] OAUTH ERROR after ${errorDuration}ms:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      code: error.code,
      isInvalidGrant: isInvalidGrant,
      errorType: error.constructor.name,
      responseData: error.response?.data
    });

    if (isInvalidGrant) {
      console.log(`❌ [${requestId}] INVALID_GRANT ERROR - This is usually caused by:`);
      console.log(`   1. Authorization code has expired (codes expire in ~10 minutes)`);
      console.log(`   2. Authorization code has already been used`);
      console.log(`   3. Clock skew between client and server`);
      console.log(`   4. Redirect URI mismatch`);
      console.log(`   5. Client ID/Secret mismatch`);
      console.log(`   🔍 Debug info: ${JSON.stringify({
        codeUsed: isCodeUsed,
        attempts: attempts,
        cacheSize: usedAuthCodes.size,
        currentTime: new Date().toISOString(),
        requestHost: req.headers.host,
        redirectUri: `http://${req.headers.host}/api/google-calendar-callback`,
        requestDuration: errorDuration,
        googleErrorCode: error.response?.status || error.code,
        googleErrorStatus: error.response?.status
      }, null, 2)}`);

      return res.redirect('/calendar?error=Authorization%20code%20expired%20or%20invalid.%20Please%20try%20connecting%20your%20calendar%20again.&debug=Google%20returned%20invalid_grant%20-%20code%20may%20be%20expired%2C%20reused%2C%20or%20invalid');
    }

    console.log(`❌ [${requestId}] Unexpected error:`, error);
    return res.redirect(`/calendar?error=Authentication%20failed&debug=Error%3A%20${encodeURIComponent(error.message)}`);
  }
} 