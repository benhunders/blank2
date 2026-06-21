# Capsule — Your Digital Wardrobe

An Indyx-inspired wardrobe app. Photograph a clothing item, have its background
removed automatically (in your browser, free & private), organize it by
category/brand/color/season, and — in later phases — build outfits, capsules,
and get AI styling suggestions.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind v4**
- **Supabase** — auth (email/password), Postgres, private Storage (RLS-protected)
- **@imgly/background-removal** — in-browser background removal (no API key)
- **@dnd-kit** — drag-and-drop outfit board (Phase 2)
- **@anthropic-ai/sdk** — AI Stylist with Claude Sonnet 4.6 (Phase 3)

## Local development

```bash
npm install
npm run dev   # http://localhost:3000
```

Environment variables live in `.env.local` (gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # publishable key
ANTHROPIC_API_KEY=...               # stylist + photo analysis, server-side
FASHN_API_KEY=...                   # virtual try-on (FASHN), server-side
FAL_KEY=...                         # virtual try-on (Kling via fal.ai), server-side
TRYON_PROVIDER=fashn                # default try-on engine: fashn | fal
NEXT_PUBLIC_TRYON_DEBUG=1           # optional: show in-app provider picker/compare
```

> **Auth note:** The MVP uses email/password. For instant accounts during
> development, disable **Confirm email** in Supabase → Authentication →
> Providers → Email. Google OAuth is planned for Phase 7.

## Roadmap

- [x] **Phase 0** — Foundation (Next.js + Supabase schema/RLS/storage)
- [x] **Phase 1** — Auth + Closet (upload, background removal, categories, grid, filters)
- [x] **Phase 2** — Outfit builder (drag-and-drop)
- [x] **Phase 3** — AI Stylist (Claude Sonnet 4.6 + live web-search trend grounding)
- [x] **Phase 4** — Capsules & packing lists (collections of items + outfits, pack checklist)
- [x] **Phase 5** — Calendar + wear logging (month view, one-tap "wore today")
- [x] **Phase 6** — Insights (cost-per-wear, most worn, orphans, category mix)
- [x] **Phase 7** — Installable PWA (manifest, icons, service worker, offline), Google OAuth, faster WebGPU background removal
- [x] **Phase 8** — Body-aware fit styling (fit profile + photo analysis via Claude vision; stylist styles for your body)
- [x] **Phase 9** — Virtual try-on (render items/outfits on your profile photo); provider-agnostic (FASHN + Kling via fal.ai) with an in-app dev toggle to compare quality/price

## Data model

`profiles`, `items`, `outfits`/`outfit_items`, `collections`/`collection_items`/
`collection_outfits`, `wears`, `stylist_sessions` — all row-level secured to
the owning user. Images are stored privately under `wardrobe/{user_id}/...` and
served via short-lived signed URLs.
