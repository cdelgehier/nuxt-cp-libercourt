// Types TypeScript pour le Club Pongiste Libercourtois

// Centralized club configuration
export interface ClubConfig {
  club: {
    name: string;
    id: string;
    salle: string;
    complexe: string;
    email: string;
    phone: string;
    website: string;
    description: string;
  };
  social: {
    facebook: {
      name: string;
      url: string;
      icon: string;
      platform: string;
    };
  };
  location: {
    name: string;
    salle: string;
    complexe: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    googleMapsUrl: string;
  };
}

// Club statistics interface for real-time data from APIs
export interface ClubStats {
  licencies: number;
  equipes: number;
  annees: number;
  lastUpdated: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: Date;
  updatedAt?: Date;
  category: "actualites" | "tournois" | "vie-du-club" | "resultats";
  featured: boolean;
  author: string;
  image?: string;
  tags: string[];
  slug: string;
}

// Types for event calendar
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  time?: string;
  location?: string;
  type:
    | "tournament"
    | "stage"
    | "competition"
    | "meeting"
    | "training"
    | "other";
  status: "upcoming" | "ongoing" | "past" | "cancelled";
  maxParticipants?: number;
  currentParticipants: number;
  registrationOpen: boolean;
  registrationDeadline?: string;
  price?: number;
  multiDay?: boolean;
  contact?: {
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  totalEvents: number;
  upcomingEvents: number;
  lastUpdated: string;
}

export interface EventRegistration {
  eventId: string;
  participant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age?: number;
    level?: "debutant" | "intermediaire" | "avance" | "expert";
    licenseNumber?: string;
    comments?: string;
  };
  registrationDate: string;
  status: "pending" | "confirmed" | "cancelled";
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  registrationId?: string;
  eventInfo?: {
    title: string;
    date: string;
    spotsRemaining?: number;
  };
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  coach?: string;
  maxParticipants?: number;
  registeredParticipants?: number;
  price?: number;
  opponent?: string;
  division?: string;
  prizePool?: string;
  image?: string;
  slug?: string;
  multiDay?: boolean;
}

export interface EventCategory {
  id: string;
  label: string;
  description: string;
  color: string;
}

export interface ClubMember {
  id: string;
  firstName: string;
  lastName: string;
  role:
    | "president"
    | "vice-president"
    | "secretary"
    | "treasurer"
    | "coach"
    | "member";
  email?: string;
  phone?: string;
  bio?: string;
  image?: string;
  joinedDate: Date;
  licenseNumber?: string;
}

export interface Schedule {
  id: string;
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  startTime: string;
  endTime: string;
  activity: string;
  level: "debutant" | "intermediaire" | "avance" | "competition" | "loisir";
  ageGroup: "enfants" | "jeunes" | "adultes" | "veterans" | "tous";
  coach?: string;
  maxPlayers?: number;
  description?: string;
}

export interface Pricing {
  id: string;
  type: "adhesion" | "cours" | "stage" | "competition" | "materiel";
  name: string;
  description: string;
  price: number;
  duration?: string;
  ageGroup?: "enfants" | "jeunes" | "adultes" | "veterans" | "famille";
  includes: string[];
  conditions?: string[];
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  website?: string;
  description?: string;
  category: "sponsor" | "partenaire" | "institutionnel";
  since?: Date;
}

export interface ContactInfo {
  clubName: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  email: string;
  website?: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  hours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

export interface NewsletterSubscription {
  email: string;
  firstName?: string;
  lastName?: string;
  interests: string[];
  subscribedAt: Date;
  active: boolean;
}

export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category: "information" | "inscription" | "partenariat" | "autre";
  sentAt: Date;
  status: "nouveau" | "lu" | "traite" | "archive";
}

// Club licensee (data from SmartPing API - real data only)
export interface Licensee {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  age?: number; // Age retrieved from xml_licence_c.php API only
  gender?: "M" | "F"; // Gender retrieved from xml_licence_c.php API only
  ranking?: string; // Points or ranking (e.g., "1200", "NC")
  category?: // Category calculated from real age when available
    | "poussin"
    | "benjamin"
    | "minime"
    | "cadet"
    | "junior"
    | "senior"
    | "veteran"
    | "surclasse";
  email?: string;
  phone?: string;
  active: boolean;
  // Real SmartPing data fields (when available)
  clast?: string; // Real FFTT classification (5, 6, 7, etc.)
  point?: string; // Real FFTT points (500, 523, etc.)
  categ?: string; // Real FFTT category (B2, C1, B1, etc.)
}

// Types pour les composants UI
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
}
