import { z } from "zod";
import type { ClubConfig } from "~/types";

// Validation schema for an event
const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string(),
  time: z.string().optional(),
  location: z.string().optional(),
  type: z.enum([
    "tournament",
    "stage",
    "competition",
    "meeting",
    "training",
    "other",
  ]),
  status: z.enum(["upcoming", "ongoing", "past", "cancelled"]),
  maxParticipants: z.number().optional(),
  currentParticipants: z.number().default(0),
  registrationOpen: z.boolean().default(false),
  registrationDeadline: z.string().optional(),
  price: z.number().optional(),
  contact: z
    .object({
      name: z.string(),
      email: z.string(),
      phone: z.string().optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CalendarResponseSchema = z.object({
  events: z.array(EventSchema),
  totalEvents: z.number(),
  upcomingEvents: z.number(),
  lastUpdated: z.string(),
});

type Event = z.infer<typeof EventSchema>;
type CalendarResponse = z.infer<typeof CalendarResponseSchema>;

export default defineEventHandler(async () => {
  try {
    // Import centralized configuration data
    const configData = await import("~/content/club/config.json");
    const config = (configData.default || configData) as ClubConfig;

    // Import events from centralized JSON file
    const eventsData = await import("~/content/events/events.json");
    const eventsJson = eventsData.default || eventsData;

    const now = new Date();
    const currentISOString = now.toISOString();

    // Transform events with data enrichment
    const allEvents: Event[] = eventsJson.events.map((evt: any) => ({
      ...evt,
      // Use event location if provided, otherwise use club default location
      location: evt.location || config.club.salle,
      // Calculate status dynamically based on date
      status: new Date(evt.date) >= now ? "upcoming" : "past",
      contact: {
        name: evt.contact.name,
        email: config.club.email,
        phone: config.club.phone,
      },
      createdAt: currentISOString,
      updatedAt: currentISOString,
    }));

    // Sort by date (newest first)
    allEvents.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Calculate dynamic stats based on dates
    const upcomingCount = allEvents.filter(
      (event) => new Date(event.date) >= now,
    ).length;

    const response: CalendarResponse = {
      events: allEvents,
      totalEvents: allEvents.length,
      upcomingEvents: upcomingCount,
      lastUpdated: currentISOString,
    };

    return CalendarResponseSchema.parse(response);
  } catch (error) {
    console.error("Error fetching calendar events:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la récupération du calendrier",
    });
  }
});
