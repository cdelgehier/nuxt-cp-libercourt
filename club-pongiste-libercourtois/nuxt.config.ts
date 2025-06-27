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

  // Image optimization
  image: {
    quality: 80,
    format: ["webp"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
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
        { property: "og:image", content: "/images/logo-club.png" },
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
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
        },
      ],
    },
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Build configuration
  nitro: {
    preset: "static",
  },

  // Runtime config
  runtimeConfig: {
    public: {
      siteName: "Club Pongiste Libercourtois",
      siteDescription: "Club de tennis de table à Libercourt depuis 1970",
      clubEmail: "cplibercourt@gmail.com",
      clubPhone: "06 60 05 12 41",
      clubAddress: "Salle Deladerriere - Complexe Leo Lagrange, Libercourt",
    },
  },

  // Tailwind CSS configuration will extend our custom theme
  tailwindcss: {
    configPath: "~/tailwind.config.js",
  },
});
