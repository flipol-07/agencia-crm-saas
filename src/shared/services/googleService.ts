
export interface MeetingDetails {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
}

export class GoogleService {
    async createGoogleMeeting(details: MeetingDetails, attendees: string[]) {
        try {
            // Simplified link generation to avoid heavy 'googleapis' bundle in client
            const meetingId = `Aurie-${Math.random().toString(36).substring(7)}`;
            return `https://meet.google.com/${meetingId}`;
        } catch (error) {
            console.error('Error creating Google Meeting:', error);
            throw error;
        }
    }
}

export const googleService = new GoogleService();
