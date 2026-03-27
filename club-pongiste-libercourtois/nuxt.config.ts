export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: "2025-07-01",

  // Modules
  modules: [
    "@nuxt/ui",
    "@nuxt/image",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "nuxt-oidc-auth",
  ],

  // CSS Framework
  css: ["~/assets/css/main.css"],

  // Image optimization - configured for Netlify static hosting
  image: {
    quality: 80,
    format: ["webp"],
    provider: "ipx",
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    // Optimize images at build time for better performance
    densities: [1, 2],
  },

  // SEO and Meta
  app: {
    head: {
      htmlAttrs: { lang: "fr" },
      title: "Club Pongiste Libercourtois - Depuis 1970",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Club de tennis de table à Libercourt depuis 1970. Découvrez nos activités, horaires, tarifs et rejoignez notre communauté pongiste.",
        },
        {
          name: "keywords",
          content:
            "ping-pong, tennis de table, Libercourt, club sportif, tournois",
        },
        { name: "author", content: "Club Pongiste Libercourtois" },
        { property: "og:title", content: "Club Pongiste Libercourtois" },
        {
          property: "og:description",
          content: "Club de tennis de table à Libercourt depuis 1970",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://cplibercourt.netlify.app" },
        {
          property: "og:image",
          content: "https://cplibercourt.netlify.app/images/logo-club.webp",
        },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        // Preload logo (LCP element) for faster rendering
        {
          rel: "preload",
          as: "image",
          href: "/images/logo-club.webp",
          type: "image/webp",
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "preload",
          as: "style",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
          media: "print",
          onload: "this.media='all'",
        },
      ],
    },
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false, // Disable typeCheck to avoid Vue type conflicts
  },

  // Route-level caching
  routeRules: {
    // Fully static pages — pre-rendered at build time, zero TTFB
    "/": { prerender: true },
    "/mentions-legales": { prerender: true },
    "/politique-confidentialite": { prerender: true },
    "/contact": { prerender: true },

    // ISR pages — SSR on first hit, then cached on Netlify CDN; background revalidation
    // Cache tags allow on-demand purge from admin mutations
    "/club": { isr: 3600, headers: { "Netlify-Cache-Tag": "club" } },
    "/faq": { isr: 3600, headers: { "Netlify-Cache-Tag": "faq" } },
    "/horaires-tarifs": {
      isr: 3600,
      headers: { "Netlify-Cache-Tag": "horaires-pricing" },
    },
    "/actualites": { isr: 300, headers: { "Netlify-Cache-Tag": "news" } },
    "/calendrier": { isr: 300, headers: { "Netlify-Cache-Tag": "events" } },
    "/equipes": { isr: 300, headers: { "Netlify-Cache-Tag": "equipes" } },
    "/licencies": { isr: 300, headers: { "Netlify-Cache-Tag": "licencies" } },

    // API routes — Netlify-CDN-Cache-Control for actual CDN caching (not just browser)
    "/api/activities": {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, max-age=300, durable",
      },
    },
    "/api/sponsors": {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, max-age=300, durable",
      },
    },
    "/api/events/upcoming": {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, max-age=60, durable",
      },
    },
    "/api/events/calendar": {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, max-age=60, durable",
      },
    },
    "/api/club/faq": {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, max-age=300, durable",
      },
    },
    "/api/club/config": {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, max-age=3600, durable",
      },
    },
    "/api/news": {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, max-age=300, durable",
      },
    },
  },

  // Build configuration
  nitro: {
    preset: "netlify",
    compressPublicAssets: true,
    prerender: {
      routes: [
        "/",
        "/mentions-legales",
        "/politique-confidentialite",
        "/contact",
      ],
      crawlLinks: false,
    },
  },

  // Experimental features for better performance
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
  },

  vite: {
    optimizeDeps: {
      include: ["zod", "vue-chartjs", "chart.js"],
    },
  },

  // Runtime config
  runtimeConfig: {
    // Private keys (only available on server-side)
    smartpingAppCode: process.env.SMARTPING_APP_CODE,
    smartpingPassword: process.env.SMARTPING_PASSWORD,
    smartpingEmail: process.env.SMARTPING_EMAIL,
    facebookPageId: process.env.FACEBOOK_PAGE_ID,
    facebookPageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,

    // Public keys (exposed to client-side)
    public: {
      clubId: process.env.CLUB_FFTT_ID ?? "07620112",
    },
  },

  // OIDC Auth — protection manuelle via middleware admin (pas de protection globale)
  oidc: {
    defaultProvider: "oidc",
    providers: {
      oidc: {
        clientId: process.env.NUXT_OIDC_CLIENT_ID ?? "",
        clientSecret: process.env.NUXT_OIDC_CLIENT_SECRET ?? "",
        issuer: process.env.NUXT_OIDC_ISSUER ?? "",
        authorizationUrl: process.env.NUXT_OIDC_AUTHORIZATION_URL ?? "",
        tokenUrl: process.env.NUXT_OIDC_TOKEN_URL ?? "",
        userinfoUrl: process.env.NUXT_OIDC_USERINFO_URL ?? "",
        redirectUri:
          process.env.NUXT_OIDC_REDIRECT_URI ??
          "http://localhost:8888/auth/callback",
        scope: ["openid", "profile", "email"],
        validateAccessToken: false,
        validateIdToken: false,
        callbackRedirectUrl: "/admin",
      },
    },
    session: {
      automaticRefresh: false,
    },
    middleware: {
      globalMiddlewareEnabled: false,
    },
  },
});
