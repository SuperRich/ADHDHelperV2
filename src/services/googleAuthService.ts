export class GoogleAuthService {
  private static CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  private static SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  private tokenClient: any = null;
  private accessToken: string | null = null;
  private initialized: boolean = false;

  async initialize() {
    if (this.initialized) {
      return;
    }

    return new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GoogleAuthService.CLIENT_ID,
          scope: GoogleAuthService.SCOPES.join(' '),
          callback: (response: any) => {
            if (response.error !== undefined) {
              throw new Error(response.error);
            }
            this.accessToken = response.access_token;
          },
        });
        this.initialized = true;
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await new Promise<void>((resolve, reject) => {
        if (!this.tokenClient) {
          reject(new Error('Token client not initialized'));
          return;
        }

        this.tokenClient.callback = (response: any) => {
          if (response.error !== undefined) {
            reject(new Error(response.error));
          }
          this.accessToken = response.access_token;
          resolve();
        };

        this.tokenClient.requestAccessToken();
      });

      if (!this.accessToken) {
        throw new Error('Failed to get access token');
      }

      return this.accessToken;
    } catch (err) {
      console.error('Sign-in error:', err);
      throw err;
    }
  }

  async signOut() {
    if (this.accessToken) {
      // Clear token without revoking
      this.accessToken = null;
      
      // Clear token client
      if (this.tokenClient) {
        this.tokenClient.callback = null;
      }

      // Clear any Google session cookies
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        if (name.trim().startsWith('GAPI')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const googleAuthService = new GoogleAuthService();

export const initializeGoogleCalendarAPI = async () => {
  try {
    console.log('Initializing Google Calendar API...');
    await gapi.client.load('calendar', 'v3');
    console.log('Google Calendar API initialized successfully');
  } catch (error) {
    console.error('Error initializing Google Calendar API:', error);
    throw error;
  }
};