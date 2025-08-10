/**
 * Club configuration utility to centralize club settings
 */

import clubConfigData from '~/content/club/config.json';

// Club configuration interface
interface ClubConfig {
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

// Load club configuration
export const clubConfig: ClubConfig = clubConfigData;

// Helper functions to get specific config values
export function getClubId(): string {
  return clubConfig.club.id;
}

export function getClubName(): string {
  return clubConfig.club.name;
}

export function getClubEmail(): string {
  return clubConfig.club.email;
}

export function getClubPhone(): string {
  return clubConfig.club.phone;
}

export function getClubLocation() {
  return clubConfig.location;
}
