#!/bin/bash

# Google Analytics Private Key Fix Script
echo "🔧 Google Analytics Private Key Fix"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

echo "📋 Current Google Analytics settings in .env.local:"
grep -n "GOOGLE_ANALYTICS" .env.local || echo "No Google Analytics settings found"
echo ""

echo "🛠️  To fix the Google Analytics private key:"
echo ""
echo "1. Open your .env.local file in a text editor:"
echo "   open .env.local"
echo ""
echo "2. Find the line starting with GOOGLE_ANALYTICS_PRIVATE_KEY="
echo ""
echo "3. Replace the entire line with this EXACT format:"
echo '   GOOGLE_ANALYTICS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDOuh/0Da939Eqv\nQn1kmskkDLiEVTEnXgUgROYgJnghN22/HK5pUqz+SgCVLBLlXNAzkpdi9yMvf4mh\naruChH+JA1rOy0o15yjbbOEz6Vumkitd01UBEFBEKVxHfJJFZlrys9fq71tugdFA\ndOUbr33mDoNNJgeg68NlSc80khYds2NLjRzGtibeQVjuV8hbfjYV/su4ovFWdpXV\nKgKJqz3NI8LNL7IF5zaR/FLRZ5s98G/AQLzRS0VwcNWxDrxZVAKXsHjW09Aun4wy\nK/sSc6+Zce5QBzR3TxLYiPPNGa63DlfK0DyoGk0TYBMovMlBOZ+xKSjLXdHqtNPL\nKVY/lXNRAgMBAAECggEARgU5CXsRMfomydIlksvy0SkV3ozUh1cLOXDc2YruKaIS\npCbc1IPSYJdEN0Kka9fSFYXTjQvUeSQjw+7Y8E5cvFXMjjrBOhy/9AKfDOw/xN3B\nnpgUNLYH2e6AeR4ylRskNwy/V64XNAj4jXKKn6QDascDpj/5WYJBvq8PZekNYKVk\nZh6Hvxu5CztYmGK6lS9eoduj3E6+ftLDzXAlGdYCwhVxjZ6SGfBfHRYDaaTfa0te\nkEU20ymGo64Htn6l/gpOss5FdcFWL8keEBiSHu26cJq7kOsPGPuWBH8vp0QACoJp\nlyWQPxpLXfm3TCOGQ/ddau72dRBXnazxypfr3tsu+QKBgQDnwUpQ+9ZM6YgA1+pn\n/MZlgduY2Z9aQQpG245yrTZsyVOo9SmNbuc3HDuqPl0FSv29OqeQkTkE0pI8Go8b\nr+uRYVGQv7yMelv+Vmx9is61ggRrNj0pFbe3K7kacqin9ehetmBfSmjZfO72Qeue\n/OjTOu9I19jjz6gtfjijJBGtewKBgQDkWo0uxOgbYXi9mbLiNGTf5x9rVdDKnb8g\n0cBv2NKADh7lSgiXT1qtifHT3yFFAvI28WhJAhdaIslFjjbIQbQiLan7BsBm3ZTi\nMZDrWUkGAym+qLGSeSfrO0V6wgfzGNweAx/zdGf15xCpsWOCPkD1xJ6+5go9IGrI\n24JZxGiaowKBgQCLSDx8vU3G/ZcSQrGK+3zU5p1umGPP30To3u0WeIk8CicwZN8r\nNBrboSkuoLpRAwfKISUxmkW1Y0QlwSR+1FR0FBPsNX+Awczl51TegnzG0zQKpxdM\nyNOXzzw46+32u7CCs4Lp4hNvmkkXUPjlnUPkJwhGNAsSpuuBI9mwGm5RXwKBgQDI\nYL0qoRabkDiHB2v1Gsy5vPHRGgiRA0NH5Ubb3oM4YyuxP/mx7KxBQ560sENdb2xj\n0goUpoUfTw8WvehMaXtL0o4p/I6wtReENMJaAosVf4kOCLFpOm9Q9z3Mrp6TLulY\nXJ2Y4Dipiw0QGtya2U3fW52BHhM1+FA72ILViofPyQKBgE3/TFndO4VCvH2ePMyK\nXq8K4JGSq0eFoaN27mOtol0a0uoJ9a5mxJ+gkIU9R9IfhYfLyqfVEFNzBQR8dS0n\nvTXbc80Y/efnzzpoyDczD5snjEg7giDBZ99vOOOUvmWtMkOWeY12OVVRAXuwxjwH\nPyCf8sHVeqFHIsUYCIoOVJAH\n-----END PRIVATE KEY-----"'
echo ""
echo "4. Save the file"
echo ""
echo "5. Test Google Analytics:"
echo "   curl http://localhost:3001/api/google-analytics"
echo ""
echo "🎯 The key things to remember:"
echo "   - Use double quotes around the entire key"
echo "   - Keep all \\n characters exactly as shown"
echo "   - Don't add any extra line breaks or spaces"
echo "   - The key should be one long line with \\n escapes"

echo ""
echo "📊 After fixing, you should see real Google Analytics data instead of fallback data" 