import { z } from "zod";
import {
  getGoogleSheetsService,
  isGoogleSheetsConfigured,
  type RegistrationData,
} from "~/server/utils/googleSheets";

// Schema de validation pour une inscription
const RegistrationSchema = z.object({
  eventId: z.string(),
  participant: z.object({
    firstName: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(10, "Numéro de téléphone invalide"),
    age: z.number().min(6).max(99).optional(),
    level: z.enum(["debutant", "intermediaire", "avance", "expert"]).optional(),
    licenseNumber: z.string().optional(),
    comments: z.string().optional(),
  }),
  registrationDate: z.string(),
  status: z.enum(["pending", "confirmed", "cancelled"]).default("pending"),
});

const RegistrationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  registrationId: z.string().optional(),
  eventInfo: z
    .object({
      title: z.string(),
      date: z.string(),
      spotsRemaining: z.number().optional(),
    })
    .optional(),
});

type RegistrationResponse = z.infer<typeof RegistrationResponseSchema>;

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event);

    if (method === "POST") {
      // Event registration
      const body = await readBody(event);

      // Data validation
      const validatedData = RegistrationSchema.parse({
        ...body,
        registrationDate: new Date().toISOString(),
        status: "pending",
      });

      // Here we would integrate Google Sheets API
      // For now, simulate successful registration

      // Get event information
      const eventResponse = await $fetch(`/api/events/calendar`);
      const eventInfo = eventResponse.events.find(
        (e: any) => e.id === validatedData.eventId,
      );

      if (!eventInfo) {
        throw createError({
          statusCode: 404,
          statusMessage: "Événement non trouvé",
        });
      }

      // Check if event still accepts registrations
      if (!eventInfo.registrationOpen) {
        throw createError({
          statusCode: 400,
          statusMessage: "Les inscriptions pour cet événement sont fermées",
        });
      }

      // Check available spaces
      if (
        eventInfo.maxParticipants &&
        eventInfo.currentParticipants >= eventInfo.maxParticipants
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: "Événement complet",
        });
      }

      // Check registration deadline
      if (
        eventInfo.registrationDeadline &&
        new Date() > new Date(eventInfo.registrationDeadline)
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: "Date limite d'inscription dépassée",
        });
      }

      // Google Sheets integration to save registration
      const registrationId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      let sheetsSaved = false;
      if (isGoogleSheetsConfigured()) {
        try {
          const sheetsService = getGoogleSheetsService();
          const registrationData: RegistrationData = {
            registrationId,
            eventId: validatedData.eventId,
            eventTitle: eventInfo.title,
            eventDate: eventInfo.date,
            firstName: validatedData.participant.firstName,
            lastName: validatedData.participant.lastName,
            email: validatedData.participant.email,
            phone: validatedData.participant.phone,
            age: validatedData.participant.age,
            level: validatedData.participant.level,
            licenseNumber: validatedData.participant.licenseNumber,
            comments: validatedData.participant.comments,
            registrationDate: validatedData.registrationDate,
            status: validatedData.status,
          };

          sheetsSaved = await sheetsService.addRegistration(registrationData);
          console.log(
            `Inscription ${registrationId} sauvegardée dans Google Sheets:`,
            sheetsSaved,
          );
        } catch (error) {
          console.error(
            "Erreur lors de la sauvegarde dans Google Sheets:",
            error,
          );
          // Continue even if Google Sheets fails
        }
      } else {
        console.warn(
          "Google Sheets non configuré - inscription non sauvegardée",
        );
      }

      // TODO: Envoyer un email de confirmation
      // TODO: Update participant count in event

      const response: RegistrationResponse = {
        success: true,
        message: sheetsSaved
          ? "Inscription réussie ! Vous recevrez un email de confirmation."
          : "Inscription enregistrée (sauvegarde Google Sheets en attente de configuration).",
        registrationId,
        eventInfo: {
          title: eventInfo.title,
          date: eventInfo.date,
          spotsRemaining: eventInfo.maxParticipants
            ? eventInfo.maxParticipants - eventInfo.currentParticipants - 1
            : undefined,
        },
      };

      return RegistrationResponseSchema.parse(response);
    } else if (method === "GET") {
      // Get registrations (for admin)
      const query = getQuery(event);
      const eventId = query.eventId as string;

      if (!eventId) {
        throw createError({
          statusCode: 400,
          statusMessage: "ID événement requis",
        });
      }

      // Get registrations from Google Sheets
      let registrations: any[] = [];
      let totalRegistrations = 0;

      if (isGoogleSheetsConfigured()) {
        try {
          const sheetsService = getGoogleSheetsService();
          const sheetsRegistrations =
            await sheetsService.getRegistrations(eventId);

          // Convertir au format attendu par l'API
          registrations = sheetsRegistrations.map((reg) => ({
            id: reg.registrationId,
            eventId: reg.eventId,
            participant: {
              firstName: reg.firstName,
              lastName: reg.lastName,
              email: reg.email,
              phone: reg.phone,
              age: reg.age,
              level: reg.level,
              licenseNumber: reg.licenseNumber,
              comments: reg.comments,
            },
            registrationDate: reg.registrationDate,
            status: reg.status,
          }));

          totalRegistrations = registrations.length;
          console.log(
            `Récupéré ${totalRegistrations} inscriptions depuis Google Sheets pour l'événement ${eventId}`,
          );
        } catch (error) {
          console.error(
            "Erreur lors de la récupération depuis Google Sheets:",
            error,
          );
          // Fallback to example data
        }
      }

      // Fallback: example data if Google Sheets is not configured or fails
      if (registrations.length === 0) {
        console.warn(
          "Utilisation des données d'exemple - Google Sheets non disponible",
        );
        registrations = [
          {
            id: "reg_example_1",
            eventId,
            participant: {
              firstName: "Jean",
              lastName: "Dupont",
              email: "jean.dupont@email.com",
              phone: "0123456789",
              level: "intermediaire",
            },
            registrationDate: "2025-01-21T10:00:00.000Z",
            status: "confirmed",
          },
        ];
        totalRegistrations = registrations.length;
      }

      return {
        registrations,
        totalRegistrations,
      };
    } else {
      throw createError({
        statusCode: 405,
        statusMessage: "Méthode non autorisée",
      });
    }
  } catch (error: any) {
    console.error("Error handling registration:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors du traitement de l'inscription",
    });
  }
});
