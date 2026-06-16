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

This repository currently contains a frontend UI prototype only.

The following are intentionally not implemented yet:

- Backend API
- Firebase Authentication
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

`.env.example` documents planned environment variables for later phases.

Current prototype behavior does not require environment variables to run locally.

Planned variables:

- `GEMINI_API_KEY` - future server-side summarization key
- `APP_URL` - future deployment URL for callbacks, links, and API configuration

## Future Improvements

- Add a backend ingestion service
- Add Firebase Authentication
- Persist sources and insights in Firestore
- Fetch and parse RSS feeds and sitemap XML
- Add duplicate detection against real content
- Generate summaries, topics, and action notes through a server-side AI workflow
- Add exportable reports
- Add tests for core UI flows

## Author

Built by Shaheer Hussain Jafri.
