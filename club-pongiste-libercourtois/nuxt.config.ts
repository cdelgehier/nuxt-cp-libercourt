import clubConfigData from "./content/club/config.json";

export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: "2025-06-23",

  // Modules
  modules: [
    "@nuxt/ui",
    "@nuxt/content",
    "@nuxt/image",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/color-mode",
    "@nuxtjs/tailwindcss",
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

  // Content module configuration
  content: {
    highlight: {
      theme: "github-light",
    },
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
        { property: "og:image", content: "/images/logo-club.webp" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
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
      siteName: clubConfigData.club.name,
      siteDescription: clubConfigData.club.description,
      clubEmail: clubConfigData.club.email,
      clubPhone: clubConfigData.club.phone,
      clubAddress: `${clubConfigData.location.salle} - ${clubConfigData.location.complexe}, ${clubConfigData.location.city}`,
      clubId: clubConfigData.club.id, // Safe to expose for client-side queries
    },
  },

  // Tailwind CSS configuration will extend our custom theme
  tailwindcss: {
    configPath: "~/tailwind.config.js",
  },
});
