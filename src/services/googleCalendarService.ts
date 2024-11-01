import { toast } from 'sonner';
/// <reference types="gapi" />
/// <reference types="google.accounts" />

// Constants for Google Calendar API
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

class GoogleCalendarService {
  private gapiInitialized = false;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;

  constructor() {
    console.log('Environment vars:', {
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      allEnv: import.meta.env
    });

    // Load the Google API script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => this.initializeGoogleApi();
    document.body.appendChild(script);

    // Load the Google Identity Services script
    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.onload = () => this.initializeGoogleIdentity();
    document.body.appendChild(gsiScript);
  }

  private async initializeGoogleApi(): Promise<void> {
    if (!gapi) return;

    try {
      await new Promise((resolve, reject) => {
        gapi.load('client', { callback: resolve, onerror: reject });
      });

      console.log('Environment vars:', {
        apiKey: API_KEY,
        clientId: CLIENT_ID
      });
      
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });

      this.gapiInitialized = true;
    } catch (error) {
      console.error('Error initializing Google API:', error);
      toast.error('Failed to initialize Google Calendar');
    }
  }

  private initializeGoogleIdentity(): void {
    if (!google?.accounts?.oauth2) return;

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {}, // Will be set during the token request
    });
  }

  private async getAuthToken(): Promise<string> {
    if (!this.gapiInitialized) {
      throw new Error('Google API not initialized');
    }
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      (this.tokenClient as any).callback = async (response: { error?: string; access_token?: string }) => {
        if (response.error) {
          reject(response);
          return;
        }
        if (!response.access_token) {
          reject(new Error('No access token received'));
          return;
        }
        resolve(response.access_token);
      };

      try {
        this.tokenClient.requestAccessToken({
          prompt: gapi.client.getToken() === null ? 'consent' : '',
          hint: 'Select your Google account'
        });
      } catch (err) {
        console.error('Auth request error:', err);
        reject(err);
      }
    });
  }

  async getUpcomingEvents() {
    try {
      await this.getAuthToken();

      // Get start and end of current week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7); // End of week (Saturday)

      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfWeek.toISOString(),
        timeMax: endOfWeek.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.result.items?.map(event => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        startTime: new Date(event.start?.dateTime || event.start?.date || new Date()),
        endTime: new Date(event.end?.dateTime || event.end?.date || new Date()),
      }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  async addWellbeingEvent(
    title: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ) {
    try {
      await this.getAuthToken();

      const event = {
        summary: title,
        description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      return response.result;
    } catch (error) {
      console.error('Error adding event to calendar:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService(); 