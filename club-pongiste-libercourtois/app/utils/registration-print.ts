/** Keep the printed list separate from the admin and match sheet styles. */
export function registrationPrintDocument(
  markup: string,
  styles: string
): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Inscriptions du tournoi</title><style>${styles}</style></head><body>${markup}</body></html>`
}
