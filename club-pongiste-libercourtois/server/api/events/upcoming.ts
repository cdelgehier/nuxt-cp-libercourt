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

const UpcomingEventsResponseSchema = z.object({
  events: z.array(EventSchema),
  count: z.number(),
  lastUpdated: z.string(),
});

type Event = z.infer<typeof EventSchema>;
type UpcomingEventsResponse = z.infer<typeof UpcomingEventsResponseSchema>;

export default defineEventHandler(async (event) => {
  try {
    // Import centralized configuration data
    const configData = await import("~/content/club/config.json");
    const config = (configData.default || configData) as ClubConfig;

    // Import events from centralized JSON file
    const eventsData = await import("~/content/events/events.json");
    const eventsJson = eventsData.default || eventsData;

    const now = new Date();
    const currentISOString = now.toISOString();

    // Get limit parameter (default 3)
    const query = getQuery(event);
    const limit = parseInt(query.limit as string) || 3;

    // Transform JSON events to API format with complete information
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

    // Filter only upcoming events and sort by date
    const filteredEvents = allEvents
      .filter((evt) => new Date(evt.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);

    const response: UpcomingEventsResponse = {
      events: filteredEvents,
      count: filteredEvents.length,
      lastUpdated: currentISOString,
    };

    return UpcomingEventsResponseSchema.parse(response);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la récupération des prochains événements",
    });
  }
});
