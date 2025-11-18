/**
 * ZERO E-Commerce - Latin American Countries
 *
 * Single source of truth for all country dropdowns across the application.
 * Used in: Registration, Checkout, Profile, Address Management
 */

export const LATIN_AMERICAN_COUNTRIES = [
  'Argentina',
  'Bolivia',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Ecuador',
  'El Salvador',
  'Guatemala',
  'Honduras',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
] as const;

export type LatinAmericanCountry = typeof LATIN_AMERICAN_COUNTRIES[number];
