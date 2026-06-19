# Content Radar

Monitor public web sources and turn updates into structured, AI-assisted insights.

Content Radar helps track public website updates, discover available feed or sitemap sources, store new content items, and convert them into structured insights for review.

Live: https://content-radar-teal.vercel.app

## Overview

Content Radar is a web dashboard for monitoring public sources such as blogs, changelogs, product update pages, news sections, and standard web pages.

Instead of manually checking scattered sources, users can add a website URL and let the system discover the best available monitoring method. The app supports RSS, Atom, sitemap discovery, and page-watch fallback when structured feeds are not available.

The system stores discovered updates in a private workspace and can generate structured insight fields such as summary, topic, signal type, relevance, why it matters, and suggested action.

## Use Cases

- Product and changelog monitoring
- Competitor update tracking
- Content and research monitoring
- Marketing and SEO source tracking

## Core Workflow

1. Add a public website URL.
2. Select a monitoring purpose.
3. Let Smart Source Discovery find the best source option.
4. Save the source to a private workspace.
5. Refresh sources to collect updates.
6. Analyze saved items into structured insights.
7. Review insights in the dashboard and open the original source when needed.

## Features

- Smart source discovery from normal website URLs
- RSS, Atom, sitemap, and page-watch fallback support
- Private user workspaces with Firebase Auth
- Firestore-backed source and item persistence
- Refresh pipeline for collecting new content updates
- AI-assisted insight generation
- Provider fallback and cached insight reuse
- Source health states for active, fallback, and inaccessible sources
- Real and sample insight filtering
- Friendly failure handling for inaccessible websites
- Responsive dashboard interface with light and dark mode support

## Source Discovery

Content Radar attempts to identify the most useful monitoring source for a website.

Supported discovery paths include:

- RSS feeds
- Atom feeds
- Sitemap URLs
- Sitemap indexes
- Common blog, news, and changelog feed paths
- Page-watch fallback for websites without structured feeds

If a site cannot be reached or does not expose usable metadata, the app marks the source as needing attention instead of showing raw technical errors.

## AI Insight Generation

Saved content items can be analyzed into structured insight fields:

- Summary
- Topic
- Signal type
- Relevance score
- Why it matters
- Action proposal
- Source information

The app supports AI provider fallback and insight caching to reduce repeated analysis for the same public URL.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend and Data

- Vercel Serverless Functions
- Firebase Authentication
- Cloud Firestore
- Firebase Admin SDK

### AI Layer

- Gemini API
- Groq API
- Cached insight layer

## Architecture

```text
Website URL
  -> Smart Source Discovery
  -> Source saved to workspace
  -> Refresh pipeline
  -> Feed / sitemap / page-watch parsing
  -> Firestore content items
  -> AI insight generation
  -> Dashboard review
```

User workspace data is stored under user-scoped Firestore paths. Public URL insight caching is stored separately and does not include private workspace context.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run type checking:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

## Environment Variables

Create a local environment file for development when needed.

See `.env.example` for the complete placeholder configuration.

Client-side Firebase configuration:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Server-side configuration:

```env
FIREBASE_SERVICE_ACCOUNT_BASE64=
GEMINI_API_KEY=
GEMINI_MODEL=
GROQ_API_KEY=
GROQ_MODEL=
AI_PROVIDER_ORDER=
DEBUG_SECRET=
```

Only placeholder names should be committed. Real environment values must stay in local or hosting environment settings.

## Security

- Real environment files are not committed.
- Server-side API keys are used only in serverless functions.
- Firebase Admin credentials are server-only.
- User data is stored in private workspace paths.
- Diagnostic endpoints are protected.
- Sample data is labeled separately from user-created data.

## Reliability Notes

Some websites block automated requests or do not expose RSS, Atom, sitemap, or usable page metadata. In those cases, Content Radar shows a clear source status instead of failing silently.

When AI processing is temporarily unavailable, parsed content remains saved and can be analyzed later.

## Engineering Highlights

- Source discovery from ordinary URLs
- Feed, sitemap, and fallback parsing flow
- Authenticated private workspace model
- Serverless refresh pipeline
- Firestore persistence
- AI provider fallback
- Insight caching by public URL
- Friendly source health states
- Clean dashboard review experience

## Author

Shaheer Hussain Jafri  
AI Systems Builder & Automation-focused Developer
