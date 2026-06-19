# Content Radar - AI Source Monitoring & Insight Automation

A recruiter-facing AI automation dashboard that turns public website updates into structured, decision-ready insights.

Live demo: https://content-radar-teal.vercel.app  
GitHub repo: https://github.com/shaheerhus85-dev/content-radar

## Why This Project Exists

Teams often monitor too many public sources manually. Product updates, competitor announcements, changelogs, research posts, and marketing signals are scattered across blogs, feeds, sitemaps, and ordinary websites.

Manual checking wastes time, and important signals can be missed. Content Radar demonstrates an automated workflow for discovering sources, refreshing them, saving parsed updates, and analyzing those updates into practical insight fields.

This is not a full SaaS company and it is not fake user data presented as real usage. It is a practical proof-of-work project showing source discovery, refresh workflows, private workspaces, AI insight generation, provider fallback, and safe failure handling.

## What The App Does

1. A user enters a public website URL.
2. Content Radar discovers the best available monitoring option: RSS, Atom, sitemap, or page-watch fallback.
3. The source is saved into the user's private Firebase workspace.
4. `Refresh Sources` checks the source for updates.
5. Parsed content items are saved to Firestore.
6. AI analysis creates a summary, topic, signal type, why-it-matters note, and action proposal.
7. Provider fallback uses Gemini, Groq, or a cached insight depending on availability.
8. If a website is inaccessible, the app shows a friendly `Needs attention` state instead of raw technical errors.

## Recruiter Demo Flow

1. Open the live demo: https://content-radar-teal.vercel.app
2. Sign up for a private workspace or open the public dashboard preview.
3. Add a source URL such as a company homepage, blog, changelog, or product updates page.
4. Choose a monitoring purpose: competitor monitoring, product updates, SEO, research, or custom.
5. Use the recommended source from Smart Source Discovery.
6. Click `Refresh Sources`.
7. Click `Analyze 1 Item`.
8. Open an insight modal.
9. Review `AI Summary`, `Why It Matters`, `Action Proposal`, and `Source Information`.
10. Open the original source link to verify the update.

## Key Features

- Smart Source Discovery from normal website URLs
- RSS, Atom, sitemap, and page-watch fallback support
- Private Firebase Auth workspace
- Firestore-backed source and item persistence
- Sample workspace onboarding for empty recruiter accounts
- Real and Sample insight filters
- Refresh result banner with saved item and fallback counts
- Source health states: `Active`, `Fallback`, `Needs attention`, and `Not checked yet`
- Gemini primary AI provider
- Groq fallback provider
- URL-based cached insight layer
- Quota-safe AI states such as `AI queued` and `Parsed only`
- Friendly failure handling with no raw HTTP/provider errors in normal UI
- Debug endpoints protected by `DEBUG_SECRET`

## Tech Stack

Frontend:

- Vite
- React
- TypeScript
- Tailwind CSS

Backend/API:

- Vercel Serverless Functions
- Firebase Auth
- Firestore
- Firebase Admin SDK

AI:

- Gemini API
- Groq API
- Cached insight layer

## Architecture Overview

```text
Website URL
-> Smart discovery
-> Source saved
-> Refresh pipeline
-> Feed/sitemap/page-watch parsing
-> Firestore items
-> AI insight generation
-> Dashboard + modal review
```

Private user data is stored under `users/{uid}`. Sources live under `users/{uid}/sources/{sourceId}` and items live under `users/{uid}/items/{itemId}`. Cached public URL insights live separately under `aiInsightCache/{urlHash}` and do not store user IDs or private workspace context.

## Environment Variables

Use placeholders only in documentation and examples. Do not commit real values.

Client:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Server:

```env
FIREBASE_SERVICE_ACCOUNT_BASE64=
GEMINI_API_KEY=
GEMINI_MODEL=
GROQ_API_KEY=
GROQ_MODEL=
AI_PROVIDER_ORDER=
DEBUG_SECRET=
```

Notes:

- `VITE_*` Firebase values are browser client configuration.
- Firebase Admin service account base64 is server-only.
- Gemini and Groq keys are server-only.
- `DEBUG_SECRET` protects diagnostic endpoints.
- Never commit `.env.local`, `.env.vercel.local`, Firebase service account JSON, private keys, or local secret files.

## Local Setup

Install dependencies:

```bash
npm install
```

Start the local frontend:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run type checking:

```bash
npm run lint
```

Local AI and Firebase server functionality requires the appropriate environment variables. Do not commit `.env.local` or `.env.vercel.local`.

## Security Notes

- Real secrets are not committed.
- `.env.example` contains placeholders only.
- Debug endpoints are protected by `DEBUG_SECRET`.
- Private workspaces are user-specific.
- Sample data is clearly labeled as `Sample workspace data`.
- Firebase Admin runs server-side only.
- Service account JSON files must stay outside the repository.

## Limitations

- Some websites block automated fetching.
- Some pages do not expose RSS feeds or sitemaps.
- Content Radar handles this with page-watch fallback or a friendly `Needs attention` state.
- AI providers can hit quota.
- If AI is unavailable, the app keeps parsed content and allows later analysis.
- This is a proof-of-work dashboard, not a production SaaS billing platform.

## Proof-Of-Work Value

Content Radar demonstrates:

- Product thinking around noisy monitoring workflows
- Practical workflow automation
- Backend API design with Vercel serverless functions
- Firebase Auth and Firestore usage
- User-private workspace boundaries
- AI provider fallback and cache-aware analysis
- Reliable failure states for recruiter testing
- A recruiter-ready UI that separates sample data from real user data

## Author

Shaheer Hussain Jafri  
AI Systems Builder & Automation-focused Developer

Built as a practical proof-of-work system for AI-assisted automation, source monitoring, and insight workflows.
