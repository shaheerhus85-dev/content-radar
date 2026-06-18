# Content Radar

Content Radar is an AI automation proof-of-work project by Shaheer Hussain Jafri. It monitors public websites, discovers usable feeds or sitemaps, saves parsed updates into private workspaces, and turns those updates into recruiter-friendly AI insights.

Live demo: `https://your-content-radar-demo-url.example`

## Why This Exists

This repository is built as GitHub proof-of-work for AI automation, full-stack product execution, and practical recruiter demo readiness. It shows how a normal website URL can become a monitored source, how parsed content is persisted safely, and how multi-provider AI analysis can produce summaries, topics, business signals, and suggested next actions.

## What It Does

- Lets visitors view a public dashboard preview without signing in.
- Lets authenticated users create a private Firebase-backed workspace.
- Lets users paste normal website URLs instead of needing to know RSS or sitemap links.
- Discovers RSS, Atom, sitemap, or webpage monitoring fallbacks.
- Refreshes saved sources through Vercel serverless APIs.
- Saves parsed items to Firestore with URL-based deduplication.
- Generates AI insight fields with Gemini first and Groq fallback.
- Uses a URL-based AI insight cache to avoid repeated provider calls for the same public article URL.
- Keeps parsed items visible when AI quota is unavailable.
- Provides a clearly labeled sample workspace for recruiter-safe demos.

## Features

- Firebase Auth with private user workspaces
- Firestore source and item persistence
- Smart source discovery from normal website URLs
- RSS, Atom, sitemap, and webpage parsing
- Authenticated source refresh endpoint
- Gemini AI summaries, topics, signal types, relevance scores, and action proposals
- Groq fallback provider for more reliable demo analysis
- Global public URL insight cache at `aiInsightCache/{urlHash}`
- Quota-safe UI states such as `AI queued` and `Parsed content saved`
- Recruiter-safe sample workspace with visible `Sample workspace data` badges
- Insight filters for All, Real, Sample, Summarized, AI Queued, and Failed
- Public demo mode that remains separate from authenticated user data
- Locked debug diagnostics with `DEBUG_SECRET`

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS v4
- Lucide React icons
- Firebase client SDK
- Firebase Auth
- Firestore
- Firebase Admin SDK
- Vercel serverless functions
- Gemini REST API
- Groq OpenAI-compatible chat completions API
- fast-xml-parser

## Architecture Overview

Frontend:

- Vite React app renders the public demo, private dashboard, source setup, insights table, and settings/report screens.
- Firebase client SDK handles authentication and user-scoped Firestore reads.
- Sample workspace data is created only when the signed-in user clicks `Load Sample Workspace`.

Backend:

- `/api/health` is public and reports basic API availability.
- `/api/discover-source` accepts a normal website URL and returns recommended monitoring candidates.
- `/api/refresh` verifies a Firebase ID token, fetches active user sources, parses items, checks the AI cache, and analyzes new items.
- `/api/analyze-existing` verifies a Firebase ID token and reprocesses one queued, skipped, or failed item by default.
- `/api/ai-debug`, `/api/gemini-debug`, and `/api/admin-debug` require `DEBUG_SECRET`.

Data:

- Private user data lives under `users/{uid}`.
- Sources live under `users/{uid}/sources/{sourceId}`.
- Items live under `users/{uid}/items/{itemId}`.
- Public URL AI insight cache entries live under `aiInsightCache/{urlHash}` and do not store user IDs or private workspace context.

## Environment Variables

Only `VITE_*` variables are exposed to the browser. All provider keys and Firebase Admin credentials are server-only.

Firebase client:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Firebase Admin:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`

AI providers:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `AI_PROVIDER_ORDER`

Diagnostics:

- `DEBUG_SECRET`

Application:

- `APP_URL`

Do not commit `.env.local`, service account JSON files, Firebase private keys, Gemini keys, Groq keys, or debug secrets.

## Recruiter Demo Flow

1. Open the live demo link.
2. Use `View Dashboard Preview` to see the public sample dashboard without logging in.
3. Sign up for a private workspace.
4. Choose `Load Sample Workspace` to view clearly labeled sample insights, or choose `Add My Own Source`.
5. Paste a normal website URL such as `https://openai.com`, `https://vercel.com`, or a company blog.
6. Pick a monitoring purpose such as competitor monitoring, product updates, SEO ideas, or industry research.
7. Let Content Radar discover the best source.
8. Refresh sources.
9. Review parsed articles and AI insights.
10. Use the insight filters to compare Real, Sample, Summarized, AI Queued, and Failed items.

## Local Development

Install dependencies:

```bash
npm ci
```

Start the Vite app:

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

Run Vercel serverless routes locally:

```bash
npx vercel dev
```

## API Notes

Authenticated routes expect a Firebase ID token:

```text
Authorization: Bearer <firebase-id-token>
```

Debug routes expect a debug token when `DEBUG_SECRET` is configured:

```text
x-debug-token: <debug-secret>
```

or:

```text
Authorization: Bearer <debug-secret>
```

## Limitations

- AI providers have free-tier and quota limits.
- If AI quota is unavailable, Content Radar keeps parsed items visible and marks them as queued for later analysis.
- Scheduled refresh and billing are intentionally not included.
- The live demo URL must be set after deployment.

## Security Notes

- No secrets are committed.
- Debug endpoints are disabled unless `DEBUG_SECRET` is configured.
- Debug endpoints never return raw API keys.
- Public demo data is separate from authenticated private workspaces.
- Sample workspace records are labeled as `Sample workspace data`.

## Author

Built by Shaheer Hussain Jafri.
