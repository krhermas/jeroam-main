# Jeroam AI provider setup

The Guide is intentionally disabled when no server-side provider is
configured. This is the expected default for local development and keeps the
public experience honest: no generated answer is shown until a real provider
responds.

## Enable the OpenAI-compatible adapter

Add these variables to the **server environment** (for example, the hosting
provider's secret settings or a local `.env` file that is never committed):

```bash
JEROAM_AI_PROVIDER=openai-compatible
JEROAM_AI_API_KEY=your-server-side-key
JEROAM_AI_MODEL=gpt-4o-mini
# Optional gateway or compatible endpoint:
# JEROAM_AI_BASE_URL=https://api.openai.com/v1
```

Restart the application after changing the environment. The Guide checks the
server status through `/api/ai`; the composer becomes available only when the
adapter reports that it is configured.

Never use `NEXT_PUBLIC_*` for an AI key. The browser sends questions to
Jeroam's `/api/ai` endpoint, and only the server adapter adds the provider
authorization header.

## Where the pieces live

- `lib/ai/types.ts` contains the provider-neutral request, response, context,
  reference and action contracts.
- `lib/ai/context.ts` builds source-aware context and
  `buildAIClientContext` strips catalog text from browser requests.
- `lib/ai/retrieval.ts` ranks a small context window from the trusted catalog
  using the question, preferences, current place/route and saved IDs.
- `lib/ai/server.ts` contains the provider interface, registry seam and the
  OpenAI-compatible adapter. Add another adapter there without changing the
  Guide UI or retrieval layer.
- `app/api/ai/route.ts` validates requests, rebuilds context from the trusted
  local catalog, and returns a structured response.
- `components/jeroam/guide.tsx` renders references, sources and safe local
  actions such as adding a referenced place to My Trip.

## Response contract

The provider must return JSON with these keys:

```json
{
  "message": "...",
  "recommendations": [],
  "places": [{"placeId": "existing-id", "claimIds": []}],
  "routes": [{"routeId": "existing-id"}],
  "sources": [{"sourceId": "existing-id", "claimIds": []}],
  "actions": [],
  "missing": []
}
```

The server normalizes references against the catalog and drops unknown IDs.
Factual claims must point to existing claim/source IDs. The UI labels the
result as AI-generated and keeps verified facts and source links separate.

## Testing

With no key configured, run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Then open `/guide`. The page should show the prepared-guide state, keep the
composer gated, and never attempt a provider request. `GET /api/ai` should
return `configured: false` without exposing environment names or secret
details.

With a provider enabled, test a place question, a nearby recommendation and a
route request. Confirm that every returned place, route and source opens the
corresponding Jeroam record and that add/save actions update the existing local
trip and saved collections.

## Adding another provider

Implement `AIProvider.complete(request)` (and optionally `stream`) in
`lib/ai/server.ts`, register its provider name in the server configuration
resolver, and keep the same `AIResponse` normalization contract. No frontend
rewrite is required.
