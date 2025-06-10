# Google Analytics Data API Setup Guide

Your Google Analytics Property ID is: **383538371**

## Quick Setup (5-10 minutes)

### Step 1: Create Google Cloud Project & Enable API

1. **Go to Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)
2. **Create/Select Project**: Create new project or select existing one
3. **Enable Google Analytics Data API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google Analytics Data API"
   - Click **Enable**

### Step 2: Create Service Account

1. **Create Service Account**:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **Service Account**
   - Name it: `google-analytics-reader`
   - Click **Create and Continue**

2. **Set Permissions** (Optional):
   - You can skip this step for now
   - Click **Done**

3. **Download JSON Key**:
   - Click on the created service account
   - Go to **Keys** tab
   - Click **Add Key** → **Create New Key**
   - Choose **JSON** format
   - Download the file (save it securely!)

### Step 3: Add Service Account to Google Analytics

1. **Go to Google Analytics**: [analytics.google.com](https://analytics.google.com)
2. **Select your property** (Property ID: 383538371)
3. **Go to Admin** → **Property** → **Property Access Management**
4. **Click "+" button** to add user
5. **Add the service account email** (from the JSON file)
6. **Set role to "Viewer"** (minimum required)
7. **Click Add**

### Step 4: Configure Environment Variables

Create or update your `.env.local` file with:

```bash
# Google Analytics Data API Configuration
GOOGLE_ANALYTICS_PROPERTY_ID=383538371
GOOGLE_ANALYTICS_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_ANALYTICS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your-private-key-here
-----END PRIVATE KEY-----"
```

**Important Notes:**
- Replace `your-service-account@...` with the email from your JSON file
- Replace `your-private-key-here` with the private_key value from your JSON file
- Keep the quotes around the private key
- The property ID is already set correctly

### Step 5: Restart Your Development Server

```bash
npm run dev
```

## Testing the Connection

1. **Visit your marketing dashboard**: [http://localhost:3001](http://localhost:3001)
2. **Check the browser console** for logs:
   - ✅ "Google Analytics configured, fetching real data..."
   - 📊 Real analytics data should appear

3. **Check terminal logs** for successful API calls

## Example JSON Key File Structure

Your downloaded JSON file should look like:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
}
```

## Troubleshooting

### Error: "Insufficient permissions"
- Make sure you enabled the Google Analytics Data API
- Verify the service account has been added to your GA property
- Check that you're using the correct property ID (383538371)

### Error: "Invalid credentials"
- Verify your `.env.local` file has the correct values
- Make sure the private key includes the full BEGIN/END lines
- Restart your development server after changing environment variables

### Error: "Property not found"
- Confirm your property ID is 383538371
- Make sure the service account has access to this specific property

## Alternative: Browser-based OAuth (5 minutes)

If you prefer a simpler setup without service accounts:

1. **Use Google Analytics Embed API** (browser-based authentication)
2. **Simpler setup** but requires user authentication each time
3. **Good for development/testing**

Let me know if you'd like me to implement the browser-based version instead!

## Current Status

✅ **Google Analytics Data API package installed**  
✅ **API integration code enabled**  
✅ **Property ID configured (383538371)**  
⏳ **Waiting for credentials setup**

Once you complete the setup above, your dashboard will show real Google Analytics data instead of mock data. 