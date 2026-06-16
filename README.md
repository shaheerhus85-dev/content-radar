# Content Radar

Content Radar is a Firebase-backed content monitoring prototype for saving RSS/sitemap sources, refreshing them through a Vercel serverless API, and presenting parsed updates in a focused dashboard.

## Overview

The project demonstrates the public landing page, demo dashboard, authenticated private workspace, and first backend ingestion path for a content monitoring product. It is designed as a recruiter-friendly showcase of product thinking, frontend execution, dashboard UX, and clean full-stack boundaries.

## Problem

Teams that follow many blogs, release feeds, and public content sources often review the same update multiple times across different channels. Content Radar is intended to reduce that noise by collecting source updates, surfacing new items, and organizing them into summaries, topics, and action notes.

## Features

- Public landing page for product positioning
- Dashboard preview with source, article, duplicate, and insight metrics
- Firebase email/password authentication
- Private workspace with Firestore-backed source persistence
- Authenticated RSS/Atom/sitemap refresh API through Vercel serverless functions
- Parsed item persistence with URL-based deduplication
- Topic and keyword filtering for insights
- Insight detail modal with source link and action note
- Simulated source refresh flow for the public demo dashboard
- Reports and settings screens
- Light and dark theme support

## Product Flow

1. A visitor lands on the product showcase page.
2. The visitor opens the dashboard preview.
3. The dashboard displays monitored content sources and recent insights.
4. The visitor can sign up or sign in to open a private workspace.
5. Authenticated users can add RSS or sitemap sources.
6. Authenticated users can refresh saved sources through the backend API.
7. Parsed items appear in the private dashboard and persist in Firestore.
8. The visitor can filter insights and open the insight review modal.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS v4
- Lucide React icons
- Motion
- Firebase client SDK
- Firebase Admin SDK
- Vercel serverless functions
- fast-xml-parser

## Current Status

This repository currently contains a Vite React frontend with Firebase authentication, Firestore source/item persistence, and a Vercel serverless refresh endpoint.

Implemented foundation:

- Public landing page and public demo dashboard
- Firebase client SDK setup
- Email/password auth UI foundation
- Authenticated private workspace shell
- Firestore user profile document creation at `users/{uid}`
- Firestore source persistence at `users/{uid}/sources/{sourceId}`
- Authenticated refresh endpoint at `POST /api/refresh`
- RSS 2.0, Atom, and sitemap XML parsing
- Parsed item persistence at `users/{uid}/items/{itemId}`

The following are intentionally not implemented yet:

- AI-generated summaries
- Gemini or other model API integration
- Scheduled refresh or cron
- Firebase Cloud Functions
- Firebase Hosting

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

`.env.example` documents Firebase client variables, server-side Firebase Admin variables, and planned later-phase variables.

The public landing page and demo dashboard can run without Firebase variables. Sign-in, sign-up, private sources, and private items require Firebase client configuration.

Firebase client variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Server-only Firebase Admin variables for `/api/refresh`:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

`FIREBASE_PRIVATE_KEY` may be stored with escaped newlines. The serverless function converts `\n` sequences into real newlines before initializing the Admin SDK.

Planned later-phase variables:

- `GEMINI_API_KEY` - future server-side summarization key
- `APP_URL` - future deployment URL for callbacks, links, and API configuration

Only `VITE_*` variables are safe for frontend exposure. Do not commit `.env.local`, service account JSON files, or real server credentials.

## Refresh API

`POST /api/refresh` is a Vercel serverless function for authenticated source refreshes.

The frontend sends a Firebase ID token in the request header:

```text
Authorization: Bearer <firebase-id-token>
```

The API verifies the token with Firebase Admin, loads active sources from `users/{uid}/sources`, fetches each RSS/Atom/sitemap URL, parses up to 10 items per source, deduplicates by SHA-256 URL hash, and saves parsed items to `users/{uid}/items/{urlHash}`.

This phase does not use Gemini or generate AI summaries. Parsed items use feed snippets and fallback review copy until the summarization phase is added.

## Firebase Security Rules

`firestore.rules` is included as a reference for the private workspace data model:

- `users/{uid}`
- `users/{uid}/sources/{sourceId}`
- `users/{uid}/items/{itemId}`

Apply these rules manually in the Firebase Console before using Firestore with real users. The rules allow each signed-in user to read and write only their own profile, sources, and items. User profile deletion is disabled.

## Future Improvements

- Add a backend ingestion service
- Generate summaries, topics, and action notes through a server-side AI workflow
- Add scheduled refresh or cron support
- Add item deletion and source health status management
- Add exportable reports
- Add tests for core UI flows

## Author

Built by Shaheer Hussain Jafri.
