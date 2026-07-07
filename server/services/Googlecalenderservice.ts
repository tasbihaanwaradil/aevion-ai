// services/googleCalendarService.ts

import { google } from "googleapis";
import GoogleToken from "../models/GoogleToken.js";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

async function getOAuthClientForUser(
  userId: string
): Promise<OAuth2Client> {
  const token = await GoogleToken.findOne({ userId });

  if (!token) {
    throw new Error(
      "Google account is not connected. Please sign in with Google first."
    );
  }

  if (!token.refreshToken) {
    throw new Error(
      "No Google refresh token found. Please reconnect your Google account."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/api/auth/google/callback"
  );

  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiry
      ? new Date(token.expiry).getTime()
      : undefined,
  });

  const expired =
    !token.accessToken ||
    !token.expiry ||
    new Date(token.expiry).getTime() < Date.now() + 60000;

  if (expired) {
    const { credentials } = await oauth2Client.refreshAccessToken();

    oauth2Client.setCredentials(credentials);

    token.accessToken =
      credentials.access_token ?? token.accessToken;

    if (credentials.expiry_date) {
      token.expiry = new Date(credentials.expiry_date);
    }

    await token.save();
  }

  return oauth2Client;
}

export interface CalendarEventInput {
  summary: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  reminders?: {
    minutesBefore: number;
    method: "popup" | "email";
  }[];
}

const buildRemindersField = (
  reminders?: {
    minutesBefore: number;
    method: "popup" | "email";
  }[]
) => ({
  useDefault: false,
  overrides: (reminders ?? []).map((r) => ({
    method: r.method,
    minutes: r.minutesBefore,
  })),
});

export async function createCalendarEvent(
  userId: string,
  event: CalendarEventInput
): Promise<string> {
  const auth = await getOAuthClientForUser(userId);

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const requestBody = event.allDay
    ? {
        summary: event.summary,
        description: event.description,
        start: {
          date: event.start.slice(0, 10),
        },
        end: {
          date: event.end.slice(0, 10),
        },
        reminders: buildRemindersField(event.reminders),
      }
    : {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start,
        },
        end: {
          dateTime: event.end,
        },
        reminders: buildRemindersField(event.reminders),
      };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody,
  });

  if (!response.data.id) {
    throw new Error(
      "Google Calendar failed to create the event."
    );
  }

  return response.data.id;
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  event: CalendarEventInput
): Promise<void> {
  const auth = await getOAuthClientForUser(userId);

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const requestBody = event.allDay
    ? {
        summary: event.summary,
        description: event.description,
        start: {
          date: event.start.slice(0, 10),
        },
        end: {
          date: event.end.slice(0, 10),
        },
        reminders: buildRemindersField(event.reminders),
      }
    : {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start,
        },
        end: {
          dateTime: event.end,
        },
        reminders: buildRemindersField(event.reminders),
      };

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody,
  });
}

export async function deleteCalendarEvent(
  userId: string,
  eventId: string
): Promise<void> {
  const auth = await getOAuthClientForUser(userId);

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });
  } catch (err: any) {
    if (err?.code === 404 || err?.code === 410) {
      return;
    }

    throw err;
  }
}