# 📅 **Easy Calendar Integration Setup**

## 🎯 **Option 1: iCal URLs (Recommended - 5 minutes setup)**

Each employee just needs to get their **private iCal URL** from Google Calendar:

### **Step 1: Get Your iCal URL**
1. Go to [Google Calendar](https://calendar.google.com)
2. On the left sidebar, find your main calendar
3. Click the **three dots (⋮)** next to your calendar name
4. Select **"Settings and sharing"**
5. Scroll down to **"Integrate calendar"**
6. Copy the **"Secret address in iCal format"** URL
   - ⚠️ **Keep this URL private** - it gives access to your calendar

### **Step 2: Send URL to Admin**
Send your iCal URL to Alex with your name:
```
Name: Alex Keal
iCal URL: https://calendar.google.com/calendar/ical/alex%40moniteye.com/private-abc123def456.ics
```

### **Step 3: Admin Adds to Environment**
Alex adds to `.env.local`:
```bash
ALEX_ICAL_URL="https://calendar.google.com/calendar/ical/alex%40moniteye.com/private-abc123def456.ics"
MARK_R_ICAL_URL="https://calendar.google.com/calendar/ical/mark.r%40moniteye.com/private-def456ghi789.ics"
MARK_N_ICAL_URL="https://calendar.google.com/calendar/ical/mark.n%40moniteye.com/private-ghi789jkl012.ics"
RICHARD_ICAL_URL="https://calendar.google.com/calendar/ical/richard%40moniteye.com/private-jkl012mno345.ics"
```

### **✅ That's it!** 
- No OAuth setup required
- No Google Cloud Console configuration
- Works immediately
- Updates automatically

---

## 🔄 **Alternative Options**

### **Option 2: Shared Service Account** ⭐⭐
**Setup time**: 30 minutes one-time setup

**What you do**:
1. Create Google service account (like you already have for Analytics)
2. Each employee shares their calendar with the service account email
3. Use API: `/api/shared-calendar-service`

**Pros**: Single API key, more secure, professional
**Cons**: Requires Google Cloud Console setup

### **Option 3: Webhook/Zapier Integration** ⭐⭐⭐
**Setup time**: 15 minutes per employee

**What employees do**:
1. Create free Zapier account
2. Set up Zap: "Google Calendar New Event" → "Webhook"
3. Point to: `https://your-domain.com/api/webhook-calendar-events`

**Pros**: Real-time updates, works with any calendar service
**Cons**: Requires Zapier account per employee

### **Option 4: Manual Export** ⭐
**Setup time**: 5 minutes weekly

**What employees do**:
1. Export Google Calendar as CSV weekly
2. Upload to shared folder/email to admin
3. Admin imports manually

**Pros**: Super simple, no technical setup
**Cons**: Not real-time, manual work

---

## 🚀 **Test the Integration**

Once URLs are configured, test at:
```
http://localhost:3000/api/simple-calendar-integration
```

Will show:
- All upcoming events from all employees
- Color-coded by employee
- Next 30 days only
- Automatically refreshes 