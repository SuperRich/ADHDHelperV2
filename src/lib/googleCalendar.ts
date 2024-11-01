import { ScheduledMoment } from './db';

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

// Replace these with your actual Google Calendar API credentials
const CLIENT_ID = 'YOUR_CLIENT_ID';
const API_KEY = 'YOUR_API_KEY';

let tokenClient: google.accounts.oauth2.TokenClient;
let gapiInited = false;
let gisInited = false;

export async function initializeGoogleApi() {
  await new Promise<void>((resolve) => {
    gapi.load('client', resolve);
  });

  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });

  gapiInited = true;
  maybeEnableButtons();
}

export function initializeGoogleIdentity() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined at request time
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.dispatchEvent(new Event('google-apis-ready'));
  }
}

export async function getAuthToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = (resp) => {
        if (resp.error) {
          reject(resp);
        }
        resolve(resp.access_token);
      };
      
      if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (err) {
      reject(err);
    }
  });
}

export async function addToGoogleCalendar(moment: ScheduledMoment) {
  try {
    await getAuthToken();

    const event = {
      summary: moment.title,
      description: moment.description,
      start: {
        dateTime: moment.date.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(moment.date.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    const request = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return request.result.id;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw error;
  }
}