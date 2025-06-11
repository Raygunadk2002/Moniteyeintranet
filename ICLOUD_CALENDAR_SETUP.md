# 📅 **iCloud Calendar Public URL Setup**

## 🍎 **Getting iCloud Calendar Public URLs**

### **Step 1: Open iCloud Calendar**
1. Go to [iCloud.com/calendar](https://www.icloud.com/calendar)
2. Sign in with your Apple ID

### **Step 2: Make Calendar Public**
1. Find your calendar in the left sidebar
2. Click the **"share" icon** (📤) next to your calendar name
3. Check **"Public Calendar"**
4. Copy the **public URL** that appears

### **Step 3: Get iCal Format URL**
The public URL will look like:
```
https://p02-calendars.icloud.com/published/2/abc123def456...
```

To get the iCal format, add `.ics` to the end:
```
https://p02-calendars.icloud.com/published/2/abc123def456.ics
```

### **Step 4: Send to Admin**
Send your iCal URL to Alex:
```
Name: [Your Name]
iCal URL: https://p02-calendars.icloud.com/published/2/abc123def456.ics
```

## 📋 **Other Calendar Providers**

### **Google Calendar**
1. Calendar Settings → Integrate calendar
2. Copy "Secret address in iCal format"
3. Format: `https://calendar.google.com/calendar/ical/yourname%40company.com/private-xyz.ics`

### **Outlook/Office 365**
1. Calendar → Share → Publish to web
2. Choose iCal format
3. Copy the generated URL

### **Apple Calendar (Mac)**
1. Right-click calendar → Share Calendar
2. Make it public
3. Copy iCal URL

## ✅ **All These Work!**
The integration supports any standard iCal (.ics) URL from:
- ✅ iCloud Calendar
- ✅ Google Calendar  
- ✅ Outlook/Office 365
- ✅ Apple Calendar
- ✅ Any other iCal-compatible service

## 🔒 **Security Note**
Public calendar URLs show your events to anyone with the link. Only share events you're comfortable being public, or use calendar-specific privacy settings. 