/// <reference types="gapi" />



/// <reference types="gapi.auth2" />



/// <reference types="gapi.client.calendar" />



// Add type definitions for Google Identity Services

interface TokenResponse {

  error?: string;

  access_token?: string;

}



interface TokenClient {

  callback: (response: TokenResponse) => void;

  requestAccessToken: (options: { prompt: string }) => void;

}



declare global {

  interface Window {

    gapi: typeof gapi;

    google?: {

      accounts: {

        oauth2: {

          initTokenClient(config: {

            client_id: string;

            scope: string;

            callback: (response: TokenResponse) => void;

          }): TokenClient;

        };

      };

    };

  }

}



class GoogleCalendarService {



  private initialized: boolean = false;



  private tokenClient: TokenClient | null = null;







  constructor() {



    // Validate required environment variables



    this.validateConfig();



  }







  private validateConfig() {



    const requiredVars = [



      'VITE_GOOGLE_API_KEY',



      'VITE_GOOGLE_CLIENT_ID',



      'VITE_GOOGLE_CALENDAR_ID'



    ];







    for (const varName of requiredVars) {



      if (!import.meta.env[varName]) {



        throw new Error(`Missing required environment variable: ${varName}`);



      }



    }



  }







  private async initializeGoogleSignIn() {



    if (this.initialized) return;







    await new Promise<void>((resolve, reject) => {



      // Load Google Identity Services script



      const gisScript = document.createElement('script');



      gisScript.src = 'https://accounts.google.com/gsi/client';



      gisScript.async = true;



      gisScript.defer = true;



      gisScript.onload = () => {



        if (!window.google?.accounts?.oauth2) {



          reject(new Error('Google Identity Services not loaded'));



          return;



        }







        // Initialize token client



        this.tokenClient = window.google.accounts.oauth2.initTokenClient({



          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,



          scope: 'https://www.googleapis.com/auth/calendar',



          callback: () => {}, // Set later when needed



        });







        // Load and initialize GAPI



        window.gapi.load('client', async () => {



          try {



            await window.gapi.client.init({



              apiKey: import.meta.env.VITE_GOOGLE_API_KEY,



              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']



            });



            



            this.initialized = true;



            resolve();



          } catch (error) {



            console.error('Google API initialization error:', error);



            reject(error);



          }



        });



      };



      gisScript.onerror = (error) => {



        console.error('Error loading Google Identity Services:', error);



        reject(error);



      };



      document.body.appendChild(gisScript);



    });



  }







  private async getToken(): Promise<void> {



    if (!this.tokenClient) throw new Error('Token client not initialized');







    return new Promise((resolve, reject) => {



      try {



        this.tokenClient!.callback = (resp: TokenResponse) => {



          if (resp.error) {



            reject(resp);



            return;



          }



          resolve();



        };







        if (window.gapi.client.getToken() === null) {



          this.tokenClient!.requestAccessToken({ prompt: 'consent' });



        } else {



          this.tokenClient!.requestAccessToken({ prompt: '' });



        }



      } catch (err) {



        reject(err);



      }



    });



  }







  async addWellbeingEvent(title: string, startTime: Date, endTime: Date, description: string) {



    try {



      if (!this.initialized) {



        await this.initializeGoogleSignIn();



      }



      



      await this.getToken();







      const event: gapi.client.calendar.Event = {



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







      const response = await window.gapi.client.calendar.events.insert({



        calendarId: import.meta.env.VITE_GOOGLE_CALENDAR_ID,



        resource: event,



      });







      return response.result;



    } catch (error) {



      console.error('Error creating calendar event:', error);



      throw error;



    }



  }







  async getUpcomingEvents() {



    try {



      if (!this.initialized) {



        await this.initializeGoogleSignIn();



      }







      const response = await window.gapi.client.calendar.events.list({



        calendarId: import.meta.env.VITE_GOOGLE_CALENDAR_ID,



        timeMin: new Date().toISOString(),



        maxResults: 10,



        singleEvents: true,



        orderBy: 'startTime',



      });







      return response.result.items;



    } catch (error) {



      console.error('Error fetching calendar events:', error);



      throw error;



    }



  }



}







export const googleCalendarService = new GoogleCalendarService();







declare global {



  interface Window {



    gapi: typeof gapi;



  }



} 


