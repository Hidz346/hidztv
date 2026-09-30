# HidzTv Total Rebuild Design

**Date:** 2026-09-30  
**Repository:** Hidz346/hidztv  
**Branch:** rebuild/hidztv-total

## Goal

Replace the existing HidzTv implementation with a clean, purpose-built Next.js application for live TV viewing, branded entirely as HidzTv/HIDZPROJECT, with a neobrutalist Y2K visual system, dark/light themes, responsive mobile-first UX, resilient HLS playback, and Vercel deployment readiness.

## Constraints

- Rebuild the application architecture from zero; do not preserve the old component/file structure.
- The existing repository and supplied ZIPs are references only; the new application must have its own clean structure and implementation.
- Use Next.js App Router, React, TypeScript, Tailwind CSS, and HLS.js.
- Keep the codebase focused: no unrelated features, dependencies, or refactors outside HidzTv.
- Use the existing HIDZPROJECT logo for favicon, metadata, header branding, player branding, and empty/loading states. Prefer the established logo URL when a local binary asset is unavailable.
- Support dark and light themes and responsive desktop/tablet/mobile layouts.
- Preserve the concept of live-channel categories and multiple source URLs, but do not copy the old channel/player components.
- Never claim an upstream stream is guaranteed live; distinguish application errors from upstream availability failures.

## Product UX

### Primary screen

1. Top navigation with HIDZPROJECT/HidzTv branding, theme toggle, search, and compact status.
2. Featured live player card.
3. Player overlay with LIVE state, channel identity, source/quality information, play/pause, mute, fullscreen, retry, and source failover messaging.
4. Category navigation: Semua, Nasional, Internasional, Hiburan & Sport, Kids, Religi.
5. Searchable responsive channel grid.
6. Selected channel state remains visible while browsing.

### Mobile UX

- Sticky compact header.
- Player spans the usable viewport width.
- Horizontal category scroller.
- Two-column channel grid on typical phones, collapsing to one column on narrow widths.
- Large touch targets and no hover-only interactions.

## Visual System

- Neobrutalism: assertive borders, intentional hard shadows, clear card hierarchy.
- Y2K: compact techno labels, subtle grid/scanline treatment, restrained neon accents.
- Avoid excessive gradients, glassmorphism, generic dashboard patterns, decorative text overload, and giant hero copy.
- Dark theme is the visual default; light theme is a first-class variant.
- Accessibility: visible focus states, semantic buttons, sufficient contrast, reduced-motion handling.

## Architecture

- `app/page.tsx`: server-rendered shell that loads the primary client application component.
- `app/layout.tsx`: metadata, favicon/logo, viewport, theme bootstrap.
- `components/hidztv-app.tsx`: client-side orchestration only; delegates UI responsibilities to focused components.
- `components/player/tv-player.tsx`: HLS video lifecycle, controls, fullscreen, failover callbacks.
- `components/channels/channel-browser.tsx`: filters, search, and channel selection.
- `components/channels/channel-card.tsx`: visual channel item.
- `components/navigation/topbar.tsx`: branding and global controls.
- `components/navigation/category-tabs.tsx`: category filter.
- `components/ui/theme-toggle.tsx`: dark/light preference.
- `lib/channels.ts`: typed channel catalogue.
- `lib/stream-engine.ts`: deterministic source ordering, deduplication, timeout/retry policy.
- `types/tv.ts`: stable data contracts.
- `app/api/streams/route.ts`: optional server-side source aggregation endpoint with a narrow response contract.
- `app/api/proxy/route.ts`: HTTP proxy only for explicitly configured HLS manifests, with strict URL validation and cache-disabled response headers.
- No Firebase, Supabase, authentication, or unrelated persistence is required for the initial rebuild.

## Stream behavior

The client receives an ordered list of candidate sources. Each source is attempted at most once per play session unless the user manually retries. HLS.js is used where supported; native HLS is used when supported without HLS.js. Fatal media errors trigger the next source. Non-fatal media errors receive bounded recovery attempts before failover. Timeouts produce a user-readable retry/fallback state.

## Error handling

- Empty source catalogue: show a stable "source unavailable" state.
- Resolver/API failure: fall back to configured static sources.
- HLS fatal error: advance to the next source.
- Browser autoplay rejection: keep playback paused and surface a play action rather than looping retries.
- Fullscreen failure: show a non-blocking message.
- Malformed/unsupported source URL: reject before playback.
- API proxy rejects non-HTTP(S) URLs or hosts not allowed by configuration.

## Performance

- Avoid unnecessary client components.
- Keep the channel catalogue static and tree-shakeable.
- Do not instantiate HLS.js until a playable channel is selected.
- Destroy HLS instances and clear timers on source/channel changes and unmount.
- Use stable keys and memoized channel filtering.
- Avoid polling.

## Verification

Required checks before production release:

- TypeScript no-emit check.
- Production Next.js build.
- Browser smoke test on desktop and mobile viewport.
- Verify page renders without console errors.
- Verify theme toggle, search, category filtering, channel selection, player state, retry/failover UI, and fullscreen action.
- Verify API routes return valid JSON/error responses.
- Verify Vercel deployment build logs are clean.

## Out of scope

- EPG backend, DVR, account system, comments, payments, admin panel, and user profile system.
- Guarantees about third-party stream uptime.
