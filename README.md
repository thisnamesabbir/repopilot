<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# RepoPilot

RepoPilot provides repository analysis, code planning, test diagnostics, and static security review with Gemma 4.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`.
3. Set `GEMMA_API_KEY` in `.env` to your Google API key. The app calls Google's Generative Language API directly; the key is only sent from the server.
4. Optionally set `GEMMA_MODEL` to a Gemma model enabled for your Google API key. The default is `gemma-4-31b-it`, with `gemma-4-26b-a4b-it` as fallback. For a compatible third-party API, also set its base URL in `GEMMA_API_BASE_URL`.
5. Run the app:
   `npm run dev`

Keep the API key server-side. Never place it in frontend code, a `VITE_` variable, or source control. If the key shared in chat is real, rotate it and configure the replacement only in your local environment or deployment secrets.

## Deploy to Vercel

Vercel serves the API through `api/[...path].ts` and builds the frontend with `npm run build`. Add `GEMMA_API_BASE_URL`, `GEMMA_API_KEY`, and (if needed) `GEMMA_MODEL` to the Vercel project's Environment Variables. The API key is never sent to the browser. The deterministic fallback remains available when Gemma 4 is unavailable.
# repopilot
