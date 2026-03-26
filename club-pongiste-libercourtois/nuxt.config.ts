export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: "2025-07-01",

  // Modules
  modules: [
    "@nuxt/ui",
    "@nuxt/image",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/color-mode",
    "@nuxtjs/tailwindcss",
    "nuxt-oidc-auth",
  ],

  // CSS Framework
  css: ["~/assets/css/main.css"],

  // UI Configuration
  ui: {
    global: true,
    safelistColors: ["club-green", "club-yellow", "club-navy"],
  },

  // Color Mode Configuration
  colorMode: {
    preference: "light", // default value
    fallback: "light", // fallback value if not set in system or localStorage
    hid: "nuxt-color-mode-script",
    globalName: "__NUXT_COLOR_MODE__",
    componentName: "ColorScheme",
    classPrefix: "",
    classSuffix: "",
    storageKey: "nuxt-color-mode",
  },

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
    // Pre-render home page as static HTML — eliminates Netlify Function cold start (~3s TTFB)
    "/": { prerender: true },
    "/api/activities": {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    },
    "/api/sponsors": {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    },
    "/api/events/upcoming": {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
      },
    },
    "/api/events/calendar": {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
      },
    },
    "/api/club/faq": {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    },
    "/api/club/config": {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
      },
    },
  },

  // Build configuration
  nitro: {
    preset: "netlify",
    compressPublicAssets: true,
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

  // Tailwind CSS configuration will extend our custom theme
  tailwindcss: {
    configPath: "~/tailwind.config.js",
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
