# Content Radar

Content Radar is a frontend UI prototype for monitoring RSS feeds and sitemap sources, filtering duplicate updates, and presenting content insights in a focused dashboard.

## Overview

The project demonstrates the public landing page and dashboard experience for a content monitoring product. It is designed as a recruiter-friendly showcase of product thinking, frontend execution, dashboard UX, and clean interaction flows.

## Problem

Teams that follow many blogs, release feeds, and public content sources often review the same update multiple times across different channels. Content Radar is intended to reduce that noise by collecting source updates, surfacing new items, and organizing them into summaries, topics, and action notes.

## Features

- Public landing page for product positioning
- Dashboard preview with source, article, duplicate, and insight metrics
- Monitored source management UI
- Local add/delete source interactions
- Topic and keyword filtering for insights
- Insight detail modal with source link and action note
- Simulated source refresh flow
- Reports and settings screens
- Light and dark theme support

## Product Flow

1. A visitor lands on the product showcase page.
2. The visitor opens the dashboard preview.
3. The dashboard displays monitored content sources and recent insights.
4. The visitor can add or remove demo sources.
5. The visitor can refresh the simulated source scan.
6. The visitor can filter insights and open the insight review modal.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS v4
- Lucide React icons
- Motion

## Current Status

This repository currently contains a Vite React frontend with a Firebase client authentication and Firestore profile foundation.

Implemented foundation:

- Public landing page and public demo dashboard
- Firebase client SDK setup
- Email/password auth UI foundation
- Authenticated private workspace shell
- Firestore user profile document creation at `users/{uid}`

The following are intentionally not implemented yet:

- Backend API
- Firestore persistence
- RSS or sitemap fetching
- AI-generated summaries
- Gemini or other model API integration
- Production authentication and authorization

Those capabilities are planned for the next implementation phase.

## Local Development

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Scripts

- `npm run dev` - start the Vite dev server on port 3000
- `npm run lint` - run TypeScript type checking
- `npm run build` - create a production build
- `npm run preview` - preview the production build

## Environment Variables

`.env.example` documents Firebase client variables and planned later-phase variables.

The public landing page and demo dashboard can run without Firebase variables. Sign-in and sign-up require Firebase client configuration.

Firebase client variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Planned later-phase variables:

- `GEMINI_API_KEY` - future server-side summarization key
- `APP_URL` - future deployment URL for callbacks, links, and API configuration

## Firebase Security Rules

`firestore.rules` is included as a reference for the private workspace data model:

- `users/{uid}`
- `users/{uid}/sources/{sourceId}`
- `users/{uid}/items/{itemId}`

Apply these rules manually in the Firebase Console before using Firestore with real users. The rules allow each signed-in user to read and write only their own profile, sources, and items. User profile deletion is disabled.

## Future Improvements

- Add a backend ingestion service
- Persist sources and insights in Firestore
- Fetch and parse RSS feeds and sitemap XML
- Add duplicate detection against real content
- Generate summaries, topics, and action notes through a server-side AI workflow
- Add exportable reports
- Add tests for core UI flows

## Author

Built by Shaheer Hussain Jafri.
