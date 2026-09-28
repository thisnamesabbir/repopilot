<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1d53cd70-e1ab-45e1-9075-672ada4105d6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

Vercel serves the API through `api/[...path].ts` and builds the frontend with `npm run build`. Add `GEMINI_API_KEY` in the Vercel project's Environment Variables for the environments where AI responses are needed. Keep it server-side; do not use a `VITE_`-prefixed variable. The API's deterministic fallback remains available when the key is absent or Gemini is unavailable.
