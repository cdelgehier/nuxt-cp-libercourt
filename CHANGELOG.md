## v1.6.0 (2026-03-30)

### Feat

- **bracket**: extract buildLicenseeFromRegistration utility with Zod schema and unit tests

## v1.5.0 (2026-03-30)

### Feat

- **ci**: add e2e job to test pipeline
- **tournament**: add full tournament management module

### Fix

- **ci**: force NITRO_PRESET=node-server for e2e build

## v1.4.0 (2026-03-27)

### Feat

- add Netlify cache tags and on-demand purge on admin mutations

## v1.3.1 (2026-03-27)

### Perf

- add ISR caching and Netlify CDN cache headers to eliminate SSR cold starts

## v1.3.0 (2026-03-27)

## v1.2.1 (2026-03-26)

### Perf

- **home**: add nitro.prerender.routes as explicit prerender config

## v1.2.0 (2026-03-26)

### Feat

- prerender home page to eliminate cold start TTFB

## v1.1.0 (2026-03-26)

### Feat

- **refonte**: Migrate to Nuxt 4 DDD architecture with Neon DB and admin section
- **teams**: Group teams by phase with collapsible UI
- **teams**: Add pool ranking display with promotion/relegation zones
- **refacto**: Refactor home page with Zod validation and infinite sponsors banner
- **news**: Integrate Facebook Graph API to fetch club posts
- **news**: Add RSS feed aggregation with compact UI
- **licensee**: Add individual estimated match points calculation badges
- **equipes**: Improve match details layout and mobile responsiveness
- Add licensee detailed modal with matches history and season winrate
- Add detailed licensee modal with matches history and points evolution
- **equipes**: add detailed match results with modern design
- **team**: update club leadership team
- Add teams page with Google Maps integration and travel time estimation
- Add filtrer on gender and age for licensees
- Add a page for licensee details with smartping credentials
- **footer**: Calculate dynamic opening hours from training sessions
- **events**: Update location in events.json
- **calendar**: Add intelligent event search and filtering
- **events**: Add Google Calendar button to event cards
- **calendar**: Add a proper date sorting for event sections
- Implement Netlify Forms for contact form and remove newsletter
- Migrate to pnpm and optimize for Netlify deployment
- Initial commit with Club Pongiste Libercourtois project

### Fix

- **sponsors**: use loading=eager on sponsor logos — lazy loading aborted by CSS transform animation
- **sponsors**: fix sponsor logo paths .png→.webp
- **eslint**: disable stylistic rules — defer formatting to prettier
- **typecheck**: resolve vue-tsc errors blocking CI
- **a11y**: achieve 100% Lighthouse accessibility and best practices on all pages
- Adapt Christmas ceremony schedule
- **api**: Use static imports instead of fs.readFileSync for Netlify compatibility
- **points**: Apply competition coefficient to match points calculation
- **club**: Harmonize licensee and team counts across all views
- Remove duplicate schedule
- Remove Management team from club vue
- Remove contact form
- Configure Netligy to exclude nuxt bundle from secret scan
- Resolve tailwindcss imports and vue typescript conflicts
- **contact**: Fix google maps link
- **calendrier**: Remove testing date
- **mentions-legales**: Change Responsable de pub
- enable API routes with Netlify preset

### Refactor

- **equipes**: remove redundant match result display
- Replace static club name with dynamic config across all Vue files

### Perf

- **lighthouse**: lazy SSR, fetchpriority logo, Nitro cache, a11y+SEO fixes
- Replace all images with optimized WebP formatt
- Optimize images and improve performance scores
