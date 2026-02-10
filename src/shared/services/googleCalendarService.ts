
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export interface CalendarEventPayload {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    attendees: string[];
}

export class GoogleCalendarService {
    private getCalendarId() {
        return process.env.GOOGLE_CALENDAR_ID || 'primary';
    }
    private async getAuth() {
        const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
        let privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;

        if (!clientEmail || !privateKey) {
            throw new Error('Google Calendar credentials are not configured in environment variables.');
        }

        // Limpiar la clave privada de comillas y corregir los saltos de línea
        // Las claves de Google vienen con \n literales si se extraen del JSON
        const cleanKey = privateKey
            .replace(/^['"]|['"]$/g, '') // Quita comillas de los extremos
            .replace(/\\n/g, '\n');       // Convierte \n literales en saltos reales

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: cleanKey,
            },
            scopes: SCOPES,
        });

        return await auth.getClient() as any;
    }

    async createEvent(payload: CalendarEventPayload) {
        const auth = await this.getAuth();
        const calendar = google.calendar({ version: 'v3', auth });

        const meetLink = process.env.GOOGLE_MEET_PERMANENT_LINK || '';

        const event = {
            summary: payload.title,
            description: `${payload.description}\n\n---\n� Link de Reunión:\n${meetLink}\n\n�👥 Asistentes:\n${payload.attendees.map(e => `• ${e}`).join('\n')}\n\n✨ Creado mediante Aurie CRM`,
            location: meetLink, // Mostramos el link como ubicación también
            start: {
                dateTime: payload.startTime,
                timeZone: 'Europe/Madrid',
            },
            end: {
                dateTime: payload.endTime,
                timeZone: 'Europe/Madrid',
            },
            // Service Accounts cannot generate Google Meet links dynamically.
            // We use the static GOOGLE_MEET_PERMANENT_LINK instead.
            // conferenceData: {
            //     createRequest: {
            //         requestId: `aurie-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            //         conferenceSolutionKey: { type: 'hangoutsMeet' },
            //     },
            // },
            visibility: 'public',
            guestsCanInviteOthers: true,
            guestsCanSeeOtherGuests: true,
        };

        try {
            const response = await calendar.events.insert({
                calendarId: this.getCalendarId(),
                requestBody: event,
                conferenceDataVersion: 1, // Crucial para que se genere el link
            });

            return {
                id: response.data.id,
                htmlLink: response.data.htmlLink,
                meetLink: meetLink || response.data.hangoutLink, // Usamos el permanente si existe, o fallback al nativo
            };
        } catch (error: any) {
            console.error('Google Calendar Error:', error?.response?.data || error);
            throw new Error(`Failed to create Google Calendar event: ${error.message}`);
        }
    }
}

export const googleCalendarService = new GoogleCalendarService();
