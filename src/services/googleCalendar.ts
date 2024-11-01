import { ScheduledMoment } from '../lib/db';

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private initialized = false;
  private tokenClient: any;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise<void>(async (resolve, reject) => {
      try {
        if (this.initialized) {
          resolve();
          return;
        }

        console.log('Initializing Google Calendar with:', {
          apiKey: API_KEY?.slice(0, 8) + '...',
          clientId: CLIENT_ID?.slice(0, 8) + '...',
        });

        // Initialize the GAPI client
        await new Promise<void>((res, rej) => {
          window.gapi.load('client', {
            callback: res,
            onerror: rej,
            timeout: 5000,
            ontimeout: () => rej(new Error('Google API client load timeout')),
          });
        });

        // Initialize the GAPI client with API key and discovery docs
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });

        // Initialize the token client
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // Will be set during use
        });

        this.initialized = true;
        resolve();
      } catch (error) {
        console.error('Error initializing Google Calendar:', error);
        this.initPromise = null;
        reject(error);
      }
    });

    return this.initPromise;
  }

  private async getToken(): Promise<string> {
    if (!this.initialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = (resp: any) => {
          if (resp.error) {
            reject(resp);
            return;
          }
          resolve(resp.access_token);
        };
        
        if (window.gapi.client.getToken() === null) {
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          this.tokenClient.requestAccessToken({ prompt: '' });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  async createEvent(moment: Omit<ScheduledMoment, 'id' | 'calendarEventId'>) {
    try {
      if (!this.initialized) {
        await this.init();
      }
      
      await this.getToken();

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const endTime = new Date(moment.date.getTime() + 60 * 60 * 1000);

      const event = {
        summary: moment.title,
        description: moment.description,
        start: {
          dateTime: moment.date.toISOString(),
          timeZone: timezone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: timezone,
        },
        reminders: {
          useDefault: true,
        },
        colorId: '7', // Pink color
        transparency: 'opaque',
        visibility: 'private',
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      return response.result.id;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    try {
      if (!this.initialized) {
        await this.init();
      }
      
      await this.getToken();

      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }
}

export const googleCalendar = GoogleCalendarService.getInstance();