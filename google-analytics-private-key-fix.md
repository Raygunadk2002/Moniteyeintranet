# 🔧 Google Analytics Private Key Format Fix

## ❌ **Current Problem**
Your private key has formatting issues causing this error:
```
"error:1E08010C:DECODER routines::unsupported"
```

## 🚫 **What's Wrong**
1. Missing line breaks at 64-character intervals  
2. Inconsistent `\n` placement  
3. Key is mostly on one line instead of proper format

## ✅ **Correct Format**

Replace your current `GOOGLE_ANALYTICS_PRIVATE_KEY` line in `.env.local` with:

```bash
GOOGLE_ANALYTICS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDOuh/0Da939Eqv\nQn1kmskkDLiEVTEnXgUgROYgJnghN22/HK5pUqz+SgCVLBLlXNAzkpdi9yMvf4mh\naruChH+JA1rOy0o15yjbbOEz6Vumkitd01UBEFBEKV‌xHfJJFZlrys9fq71tugdFA\nndOUbr33mDoNNJgeg68NlSc80khYds2NLjRzGtibeQVjuV8hbfjYV/su4ovFWdpX\nVKgKJqz3NI8LNL7IF5zaR/FLRZ5s98G/AQLzRS0VwcNWxDrxZVAKXsHjW09Aun4w\nyK/sSc6+Zce5QBzR3TxLYiPPNGa63DlfK0DyoGk0TYBMovMlBOZ+xKSjLXdHqtNP\nLKVY/lXNRAgMBAAECggEARgU5CXsRMfomydIlksvy0SkV3ozUh1cLOXDc2YruKaIS\npCbc1IPSYJdEN0Kka9fSFYXTjQvUeSQjw+7Y8E5cvFXMjjrBOhy/9AKfDOw/xN3B\nnpgUNLYH2e6AeR4ylRskNwy/V64XNAj4jXKKn6QDascDpj/5WYJBvq8PZekNYKVk\nZh6Hvxu5CztYmGK6lS9eoduj3E6+ftLDzXAlGdYCwhVxjZ6SGfBfHRYDaaTfa0te\nkEU20ymGo64Htn6l/gpOss5FdcFWL8keEBiSHu26cJq7kOsPGPuWBH8vp0QACoJp\nlyWQPxpLXfm3TCOQG/ddau72dRBXnazxypfr3tsu+QKBgQDnwUpQ+9ZM6YgA1+pn\n/MZlgduY2Z9aQQpG245yrTZsyVOo9SmNbuc3HDuqPl0FSv29OqeQkTkE0pI8Go8b\nr+uRYVGQv7yMelv+Vmx9is61ggRrNj0pFbe3K7kacqin9ehetmBfSmjZfO72Qeue\n/OjTOu9I19jjz6gtfjijJBGtewKBgQDkWo0uxOgbYXi9mbLiNGTf5x9rVdDKnb8g\n0cBv2NKADh7lSgiXT1qtifHT3yFFAvI28WhJAhdaIslFjjbIQbQiLan7BsBm3ZTi\nMZDrWUkGAym+qLGSeSfrO0V6wgfzGNweAx/zdGf15xCpsWOCPkD1xJ6+5go9IGrI\n24JZxGiaowKBgQCLSDx8vU3G/ZcSQrGK+3zU5p1umGPP30To3u0WeIk8CicwZN8r\nNBrboSkuoLpRAwfKISUxmkW1Y0QlwSR+1FR0FBPsNX+Awczl51TegnzG0zQKpxdM\nyNOXzzw46+32u7CCs4Lp4hNvmkkXUPjlnUPkJwhGNAsSpuuBI9mwGm5RXwKBgQDI\nYL0qoRabkDiHB2v1Gsy5vPHRGgiRA0NH5Ubb3oM4YyuxP/mx7KxBQ560sENdb2xj\n0goUpoUfTw8WvehMaXtL0o4p/I6wtReENMJaAosVf4kOCLFpOm9Q9z3Mrp6TLulY\nnXJ2Y4Dipiw0QGtya2U3fW52BHhM1+FA72ILViofPyQKBgE3/TFndO4VCvH2ePMy\nKXq8K4JGSq0eFoaN27mOtol0a0uoJ9a5mxJ+gkIU9R9IfhYfLyqfVEFNzBQR8dS0\nnvTXbc80Y/efnzzpoyDczD5snjEg7giDBZ99vOOOUvmWtMkOWeY12OVVRAXuwxjw\nHPyCf8sHVeqFHIsUYCIoOVJAH\n-----END PRIVATE KEY-----"
```

## 📝 **How to Fix**

1. **Open** your `.env.local` file in a text editor
2. **Find** the line starting with `GOOGLE_ANALYTICS_PRIVATE_KEY=`
3. **Replace** the entire line with the corrected version above
4. **Save** the file
5. **Restart** your development server

## 🎯 **Key Rules for Private Keys**

1. ✅ **Each line ends with `\n`** (except the quotes)
2. ✅ **64 characters per line** (approximately)
3. ✅ **Wrapped in double quotes**
4. ✅ **No actual line breaks** in the environment file
5. ✅ **Proper `-----BEGIN/END-----` tags**

## 🧪 **Test After Fix**

Once you've updated the key format, test with:
```bash
curl http://localhost:3001/api/google-analytics
```

You should see live Google Analytics data instead of the decoder error! 