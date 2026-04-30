# Kalā Kathā — A platform for documenting Indian indigenous crafts

A handcrafted, human-centered web app where artisans document their own work —
in their own words, voice and language — without needing institutions or
technical expertise.

> The codebase is unbranded: `Kalā Kathā` is a placeholder name. Search and
> replace `brand.name` in `src/i18n/translations.js` to rebrand without
> touching the rest of the code.

## What's inside

- **Vite + React 18** with `react-router-dom` for routing.
- **Tailwind CSS** with a custom earthy palette, hand-drawn SVG decorations,
  paper-grain background and serif/handwriting display typography.
- **5-language i18n** with persistent switcher (English, Hindi, Hinglish,
  Bengali, Tamil — bn/ta intentionally fall back to English where strings
  haven't been translated yet, so untranslated keys are obvious).
- **Phone-OTP auth** (mocked, in-browser) with two roles: `artisan` and
  `explorer`.
- **6-step artisan flow** (`/document`):
  1. Upload photos (front required; back/top/bottom optional)
  2. Basic details (with regional & tradition suggestions)
  3. Story — type, voice-to-text (Web Speech API) or guided questions
  4. AI processing — placeholder Tripo 3D + GPT calls
  5. Review & edit
  6. Publish or save as draft
- **Explorer flow** — `/explore` with region & tradition filters, search,
  and a `/craft/:id` detail page with image gallery + `<model-viewer>` 3D and
  WebAR support.
- **Dashboard** — My Crafts, Drafts (auto-saved), Add New.
- **Persistence** — `localStorage` backed (no server). Swap the API modules
  in `src/api/*` and the Auth/Crafts contexts to wire a real backend.

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>. The dev server opens automatically.

To explore the artisan flow, choose **I'm an artisan** on the home CTA →
sign up with any phone number → enter any 4 digits as the OTP. Drafts and
published crafts persist in your browser.

## Project structure

```
src/
  main.jsx          App entry; mounts all 3 context providers
  App.jsx           Routes; gates protected routes via <RequireAuth/>
  index.css         Tailwind layers + paper/sketch component classes
  i18n/             Translation dictionary + LANGUAGES list
  context/          Language, Auth, Crafts providers (localStorage backed)
  api/              Placeholder calls for Tripo 3D + GPT (text + images)
  hooks/            useVoiceInput (Web Speech API wrapper)
  components/       Layout, Header, Footer, LanguageSwitcher,
                    ImageUploader, ModelViewer wrapper, Stepper,
                    CraftCard, Decorations, Icons, RequireAuth
  pages/
    Home.jsx
    Auth.jsx
    Explore.jsx
    CraftDetail.jsx
    Dashboard.jsx
    NotFound.jsx
    Document/
      index.jsx          Stateful container for the 6-step flow
      Step1Upload.jsx
      Step2Details.jsx
      Step3Story.jsx
      Step4Processing.jsx
      Step5Review.jsx
      Step6Publish.jsx
  data/seedCrafts.js     Sample crafts shown on Home & Explore
public/favicon.svg
```

## Wiring real APIs

Both `src/api/tripo.js` and `src/api/gpt.js` are async mocks with the same
signatures you'd want from real calls. To wire production:

1. Stand up a backend that holds your API keys (never put them in the
   browser bundle).
2. In `tripo.js`, replace `generate3DModel` with a call to your endpoint
   that proxies Tripo's `image_to_model` task and returns a `.glb` URL.
3. In `gpt.js`, replace `describeCraft` and `generateSupportingImages`
   with backend endpoints that call OpenAI / Anthropic / etc.
4. Replace the `localStorage` sides of `AuthContext` and `CraftsContext`
   with real fetch calls.

The component tree above the API boundary doesn't need any changes.

## 3D + AR

The detail page uses Google's `<model-viewer>` web component, loaded as a
module script in `index.html`. It supports:

- **Desktop:** drag to orbit, pinch/scroll to zoom.
- **Android Chrome:** "View in your room" launches Scene Viewer (WebAR).
- **iOS Safari:** the same button launches Quick Look if a `.usdz` is
  provided alongside the `.glb`.

The seed crafts borrow `.glb` files from the `model-viewer` sample
collection so the demo works offline-style without a Tripo account.

## Accessibility & the low-literacy bar

- Touch targets meet ≥44×44 px.
- Every interactive element has a visible focus ring (`ring-mustard`).
- Voice input + AI guided questions remove the typing requirement.
- All step nav uses icons + words, not just words.
- Hindi rendering uses `Tiro Devanagari Hindi`, set on the `.deva`
  helper class.

## Conventions

- All copy lives in `src/i18n/translations.js` — never hardcoded in
  components. Add new keys there first.
- Earthy color tokens are in `tailwind.config.js`. Avoid raw hex values
  in components.
- Hand-drawn flourishes (`Paisley`, `Sun`, `Kolam`, `Leaf`, `Divider`)
  live in `src/components/Decorations.jsx`. Compose, don't replace.
