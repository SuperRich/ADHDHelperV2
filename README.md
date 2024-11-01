# ADHDHelperV2

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/SuperRich/ADHDHelperV2)

## Google Calendar Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials
5. Add the following environment variables to your `.env` file:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - GOOGLE_CALENDAR_ID

The application will now be able to:
- Display upcoming calendar events
- Add new wellbeing activities to the shared family calendar
- Sync events between family members