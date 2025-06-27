## 🚀 Quick Start

### Requirements

- **Node.js 20+** (recommended: 24+)
- **npm**, **yarn** or **pnpm**

### ⚡ Standard Installation

```bash
# Clone the project
git clone <repo-url>
cd club-pongiste-libercourtois

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## ✨ Main Features

### 🎯 **Smart Event Management**

- **100% dynamic event system** based on JSON with TypeScript validation
- **Automatic categorization**: open/closed registrations, past/upcoming events
- **Multi-day support** for tournaments with date management
- **Dynamic locations**: each event can have its own location
- **Mobile-friendly design** with interactive event cards and adaptive labels

### 🌓 **Advanced Dark Mode Support**

- **Complete dark/light mode** on all pages and components
- **Custom adaptive classes** (`adaptive-title`, `adaptive-text`, `adaptive-card`, `adaptive-label`)
- **Smooth transitions** between modes with preference persistence
- **Consistent colors** with automatic contrast management
- **Optimized labels and badges** for perfect visibility in all modes

### 📊 **100% Data-Driven Architecture**

- **Centralized club configuration** in `/content/club/config.json`
- **Dynamic events** in `/content/events/events.json`
- **FAQ with calculated statistics** automatically (number of questions/categories)
- **Consistent REST APIs** with smart data enrichment
- **Complete TypeScript validation** with typed interfaces
- **No static data**: everything is managed by APIs and JSON

### 🔗 **External Integrations**

- **SmartPing FFTT API** for official member data
- **Google Sheets** for collaborative data management
- **Complete REST APIs** with documentation and error handling
- **SEO optimized** with dynamic metadata and Open Graph

## 🏗️ Project Architecture

```text
club-pongiste-libercourtois/
├── app.vue             # Root component with SEO and global layout
├── nuxt.config.ts      # Nuxt configuration with modules and plugins
├── components/         # Reusable Vue components
│   ├── AdaptiveLogo.vue    # Adaptive logo (dark/light mode)
│   ├── AppHeader.vue       # Header with responsive navigation
│   ├── AppFooter.vue       # Footer with club information
│   ├── ColorModeToggle.vue # Dark/light mode toggle
│   ├── Club/               # Club-specific components
│   │   └── FaqWidget.vue   # FAQ widget with dynamic stats
│   └── Events/             # Event components
│       ├── EventCard.vue   # Event card with adaptive labels
│       └── RegistrationModal.vue # Registration modal
├── content/            # Static content (JSON/Markdown)
│   ├── club/           # Club information
│   │   ├── config.json     # Main club configuration
│   │   ├── about.json      # History and presentation
│   │   ├── faq.json        # FAQ (without static stats)
│   │   ├── schedules.json  # Training schedules
│   │   ├── pricing.json    # Prices and membership fees
│   │   └── team.json       # Management team
│   └── events/         # Events and tournaments
│       ├── events.json     # Main events with locations
│       └── facebook_events.json # Facebook events (optional)
├── pages/              # Application pages (automatic routing)
│   ├── index.vue           # Homepage with upcoming events
│   ├── club.vue            # Club presentation
│   ├── calendrier.vue      # Event calendar
│   ├── horaires-tarifs.vue # Schedules and prices
│   ├── faq.vue             # FAQ with search
│   ├── contact.vue         # Contact and location
│   └── admin.vue           # Administration interface
├── server/             # Backend API (Nitro)
│   ├── api/
│   │   ├── events/         # Event APIs
│   │   │   ├── calendar.ts     # All events categorized
│   │   │   ├── upcoming.ts     # Upcoming events only
│   │   │   └── register.ts     # Registration management
│   │   ├── club/           # Club APIs
│   │   │   ├── events.ts       # Club events (data-driven)
│   │   │   ├── faq.ts          # FAQ with calculated stats
│   │   │   ├── about.ts        # Club information
│   │   │   ├── config.ts       # Public configuration
│   │   │   └── stats.ts        # Club statistics
│   │   └── fftt/           # FFTT integration
│   │       └── documents.ts    # Official documents
│   └── utils/          # Server utilities
│       ├── googleSheets.ts     # Google Sheets integration
│       └── smartping.ts        # SmartPing FFTT API
├── types/              # TypeScript types
│   └── index.ts            # Main interfaces and types
├── public/             # Static assets
│   ├── images/             # Club and event images
│   └── favicon.ico
├── composables/        # Vue composables
│   ├── useClubFaq.ts       # FAQ management
│   └── useClubStats.ts     # Club statistics
└── docs/               # Technical documentation
    ├── architecture-page-club.md
    ├── vue-basics-guide.md
    └── vue-club-explained.md
```

## 📱 Pages and Features

- **Home** (`/`) - Homepage with club presentation and dynamic upcoming events
- **Club** (`/club`) - History, mission and team with enriched data
- **Calendar** (`/calendrier`) - Smart event calendar with registrations and automatic categorization
- **Schedules & Prices** (`/horaires-tarifs`) - Training schedules and price list
- **Contact** (`/contact`) - Contact form and practical information
- **FAQ** (`/faq`) - Frequently asked questions with real-time calculated statistics
- **Administration** (`/admin`) - Administration interface for content management

### 🎨 Design System & Accessibility

- **Main colors**: Yellow (#FFD700), Green (#20B2AA), Red (#DC143C)
- **Typography**: Inter/System UI with clear hierarchy
- **Components**: Nuxt UI with custom styles and adaptive classes
- **Responsive design**: Mobile-first with optimized breakpoints
- **Accessibility**: Proper contrasts, keyboard navigation, aria-labels
- **Dark mode**: Complete support with smooth transitions

## 🔧 Available Scripts

```bash
# Development
npm run dev         # Development server (http://localhost:3000)
npm run build       # Optimized production build
npm run preview     # Preview production build
npm run generate    # Static generation (SSG)

# Code quality
npm run lint        # Code style checking (ESLint)
npm run typecheck   # TypeScript type checking
npm run format      # Automatic code formatting (Prettier)

# Testing and validation
npm run test        # Run unit tests
npm run test:e2e    # End-to-end tests (if configured)

# Docker (if available)
docker-compose up dev   # Development environment
docker-compose up prod  # Production environment
```

## 📊 APIs and Endpoints

### 🗓️ Event APIs (100% data-driven)

- `GET /api/events/calendar` - All events with smart categorization
- `GET /api/events/upcoming` - Upcoming events only with registration status
- `POST /api/events/register` - Event registration

### 🏓 Club APIs (enriched data)

- `GET /api/club/about` - Club information (history, mission, values)
- `GET /api/club/events` - Club events (without static data)
- `GET /api/club/faq` - FAQ with dynamically calculated statistics
- `GET /api/club/config` - Public club configuration
- `GET /api/club/contact` - Contact details and practical information
- `GET /api/club/schedules-pricing` - Schedules and prices
- `GET /api/club/stats` - Real-time club statistics
- `GET /api/club/team` - Management team and coaching staff

### 🏆 FFTT APIs (official integration)

- `GET /api/fftt/documents` - Official documents and rankings
- `GET /api/club/licensees` - Members via SmartPing API

### 📊 API Features

- **Complete TypeScript validation** with typed interfaces
- **Robust error handling** with appropriate HTTP codes
- **Automatic data enrichment** (location, status, etc.)
- **Optimized performance** with smart caching
- **Integrated documentation** with usage examples

## 🌍 Configuration and Environment

### Environment Variables

```bash
# Optional integrations
GOOGLE_SHEETS_API_KEY=your_api_key
SMARTPING_API_TOKEN=your_token
FACEBOOK_ACCESS_TOKEN=your_token

# Configuration
NUXT_PUBLIC_SITE_URL=https://your-domain.com
NUXT_PUBLIC_CLUB_NAME="Club Pongiste Libercourtois"
```

### Operating Modes

- **Development**: Uses local JSON data with hot-reload
- **Production**: Can integrate external services (Google Sheets, FFTT)
- **Hybrid mode**: Automatic fallback to local data if external APIs fail

## 📚 Technical Documentation

Complete documentation is available in the `/docs` folder:

- **Page architecture**: Detailed guide for component structure
- **Vue.js guide**: Project best practices and conventions
- **Club explanation**: Business logic and management rules
- **APIs and integrations**: Endpoint documentation and external services

### 🔄 Data-Driven Features

- **No hard-coded data**: All information comes from JSON files
- **Smart APIs**: Automatic enrichment and data validation
- **Calculated statistics**: FAQ, events, and real-time metrics
- **Dynamic location**: Support for events with specific locations
- **State management**: Vue composables for centralized data management

## 🐳 Docker Support (optional)

The project includes Docker configuration for easy deployment:

```bash
# Development environment
docker-compose up dev

# Production environment
docker-compose up prod
```

## 🚀 Deployment and Performance

### Included Optimizations

- **SSR/SSG**: Server-side rendering and static generation
- **Code splitting**: Progressive component loading
- **Image optimization**: Compression and modern formats
- **Lazy loading**: Deferred resource loading
- **SEO optimized**: Dynamic metadata and Open Graph
- **PWA ready**: Configuration for progressive web app

### Recommended Deployment Platforms

- **Netlify**: Automatic deployment with preview branches
- **Vercel**: Native Git integration with edge functions
- **GitHub Pages**: For static generation (SSG)
- **VPS/Server**: Deployment with PM2 or Docker

## 🤝 Contributing and Development

### Contribution Workflow

1. **Fork** the project to your GitHub account
2. **Clone** your fork locally
3. **Create** a feature branch (`git checkout -b feature/new-feature`)
4. **Develop** following project conventions
5. **Test** your changes with `npm run typecheck` and `npm run lint`
6. **Commit** your changes (`git commit -m 'Add: new feature'`)
7. **Push** to your branch (`git push origin feature/new-feature`)
8. **Open** a Pull Request with detailed description

### Code Standards

- **Strict TypeScript**: Complete typing required
- **Vue 3 Composition API**: Prefer composables over mixins
- **Naming conventions**: PascalCase for components, camelCase for variables
- **Documentation**: Comment complex functions and APIs
- **Testing**: Add tests for new features

## 🐛 Debugging and Troubleshooting

### Common Issues

```bash
# Nuxt cache errors
rm -rf .nuxt node_modules/.cache && npm install

# TypeScript type issues
npm run typecheck -- --noEmit

# API verification
curl http://localhost:3000/api/events/upcoming

# Detailed logs in development
DEBUG=nuxt:* npm run dev
```

### Development Tools

- **Vue DevTools**: Browser extension for Vue debugging
- **Nuxt DevTools**: Built-in debugging interface for Nuxt 3
- **TypeScript**: Real-time type checking
- **ESLint + Prettier**: Automatic code formatting and quality

## 📄 License and Copyright

This project is licensed under the **MIT License**. See the `LICENSE` file for complete details.

### Credits

- **Framework**: Nuxt 3, Vue 3, TypeScript
- **UI**: Nuxt UI, Tailwind CSS
- **Integrations**: SmartPing FFTT, Google Sheets API
- **Development**: Club Pongiste Libercourtois

---

## 🏓 Club Pongiste Libercourtois - Since 1970

Modern, dynamic and accessible website for table tennis in Libercourt
