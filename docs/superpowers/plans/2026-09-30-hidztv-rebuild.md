# HidzTv Total Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clean HidzTv application from scratch with HLS live playback, HIDZPROJECT branding, neobrutalist/Y2K UI, theme switching, responsive channel browsing, and Vercel-ready production behavior.

**Architecture:** Replace the current app with focused App Router, player, channel-browser, navigation, and stream-engine modules. Keep channel data typed and static; isolate runtime playback and server routes from presentation.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, HLS.js, Lucide React only where useful.

**Spec:** `docs/superpowers/specs/2026-09-30-hidztv-rebuild-design.md`

## Global Constraints

- Rebuild the application architecture from zero; do not preserve the old component/file structure.
- Use Next.js App Router, React, TypeScript, Tailwind CSS, and HLS.js.
- Use the existing HIDZPROJECT logo for favicon and in-app branding.
- Support dark/light themes and responsive desktop/tablet/mobile layouts.
- Treat upstream stream availability as external and never as a guaranteed application invariant.
- No authentication or external persistence in the initial rebuild.

## Review Focus

- Invalid or empty HLS source: playback must fail gracefully and continue through the candidate list.
- Stale/destroyed HLS instance: channel changes must not leave timers, event handlers, or playback state behind.
- Autoplay blocked: UI must remain stable and offer user-initiated playback.
- Unsupported URL/proxy target: server route must reject it with structured JSON rather than fetching arbitrary destinations.
- Narrow mobile viewport: controls and channel cards must remain usable without horizontal page overflow.

---

### Task 1: Replace the project foundation

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `next.config.ts`
- Modify: `postcss.config.mjs`
- Modify: `vercel.json`
- Create: `.env.example`
- Create: `types/tv.ts`

**Interfaces:**
- Produces `Channel`, `ChannelCategory`, and player/source result types for later tasks.

- [ ] **Step 1: Write the type contract first**
  Define `Channel`, `ChannelCategory`, `StreamAttemptResult`, and `PlaybackStatus` with explicit unions for supported states.
- [ ] **Step 2: Run TypeScript**
  Run: `npx tsc --noEmit`
  Expected: existing project may fail until later tasks are applied; the new contracts themselves must parse cleanly.
- [ ] **Step 3: Replace project configuration**
  Set scripts for dev, build, start, and type-check; keep dependencies minimal and pinned to compatible versions.
- [ ] **Step 4: Verify configuration**
  Run: `npm install && npm run typecheck`
  Expected: configuration loads; remaining failures are only from old files that will be removed in Task 2.
- [ ] **Step 5: Commit**
  Commit message: `chore: establish HidzTv rebuild foundation`

### Task 2: Replace the application shell and visual system

**Files:**
- Delete: old `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, and legacy UI/component files not used by the new architecture.
- Create: `app/page.tsx`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `components/hidztv-app.tsx`
- Create: `components/navigation/topbar.tsx`
- Create: `components/navigation/category-tabs.tsx`
- Create: `components/ui/theme-toggle.tsx`

**Interfaces:**
- `HidzTvApp` owns selected channel, category, query, and theme-visible UI state.
- `Topbar` consumes `query`, `onQueryChange`, and `onThemeToggle`.
- `CategoryTabs` consumes `activeCategory`, `onCategoryChange`, and category counts.

- [ ] **Step 1: Define theme variables**
  Implement semantic CSS variables for background, surface, text, border, accent, and shadow in dark and light modes.
- [ ] **Step 2: Build the page shell**
  Create semantic `main/header/section` structure with responsive width constraints and no fixed desktop-only dimensions.
- [ ] **Step 3: Add HIDZPROJECT branding**
  Use the established logo URL in metadata, header, and fallback brand treatment.
- [ ] **Step 4: Add theme persistence**
  Store a single local theme preference and respect system preference when no explicit value is stored.
- [ ] **Step 5: Verify UI compile**
  Run: `npm run typecheck`
  Expected: PASS for the new shell before player/channel modules are wired.
- [ ] **Step 6: Commit**
  Commit message: `feat: add HidzTv visual shell and themes`

### Task 3: Create the channel catalogue and browser

**Files:**
- Create: `lib/channels.ts`
- Create: `components/channels/channel-card.tsx`
- Create: `components/channels/channel-browser.tsx`

**Interfaces:**
- `getChannels(): readonly Channel[]`
- `getCategoryCounts(): Record<'all' | ChannelCategory, number>`
- `ChannelBrowser` emits a selected channel ID.

- [ ] **Step 1: Add catalogue tests**
  Assert every channel has a unique ID, positive channel number, valid category, and at least one candidate source or explicit unavailable state.
- [ ] **Step 2: Run tests to verify they fail**
  Run the project test command after adding the test harness.
  Expected: FAIL until the catalogue is implemented.
- [ ] **Step 3: Implement typed catalogue**
  Populate the new catalogue with the channels/sources selected for the fresh build; do not copy old UI data structures.
- [ ] **Step 4: Implement browser filtering**
  Filter by category and case-insensitive name/region/language search; keep selected state stable.
- [ ] **Step 5: Implement cards**
  Cards must show logo/monogram, name, category, channel number, and clear unavailable state.
- [ ] **Step 6: Run tests and type-check**
  Expected: PASS with no TypeScript errors.
- [ ] **Step 7: Commit**
  Commit message: `feat: add typed channel catalogue and browser`

### Task 4: Implement the stream engine

**Files:**
- Create: `lib/stream-engine.ts`
- Create: `app/api/streams/route.ts`

**Interfaces:**
- `buildCandidateSources(sources: readonly string[], origin?: string): string[]`
- `isSupportedStreamUrl(value: string): boolean`
- API GET `/api/streams?channel=<id>` returns `{ channelId, sources }`.

- [ ] **Step 1: Add tests**
  Test deduplication, empty input, malformed URLs, and preservation of source order.
- [ ] **Step 2: Run tests to verify they fail**
  Expected: FAIL before implementation.
- [ ] **Step 3: Implement URL validation/deduplication**
  Accept only http/https URLs and reject malformed values.
- [ ] **Step 4: Implement API route**
  Resolve a channel from the static catalogue and return a narrow JSON contract; return 404/400 JSON errors for invalid requests.
- [ ] **Step 5: Verify route behavior**
  Run type-check and route-level tests.
  Expected: PASS.
- [ ] **Step 6: Commit**
  Commit message: `feat: add stream source engine and API`

### Task 5: Build the HLS player

**Files:**
- Create: `components/player/tv-player.tsx`
- Create: `components/player/player-controls.tsx`
- Create: `components/player/player-status.tsx`

**Interfaces:**
- `TvPlayerProps`: `channel: Channel | null`, `sources: string[]`.
- Player emits retry/source-change callbacks only; orchestration remains in `HidzTvApp`.

- [ ] **Step 1: Add player lifecycle tests**
  Cover source changes, cleanup, empty sources, and retry callback behavior.
- [ ] **Step 2: Run tests to verify they fail**
  Expected: FAIL before component implementation.
- [ ] **Step 3: Implement HLS lifecycle**
  Create/destroy HLS instances per source; clear timers and handlers on cleanup.
- [ ] **Step 4: Implement native HLS fallback**
  Use native HLS only when the browser reports support and HLS.js is unavailable/unsupported.
- [ ] **Step 5: Implement controls**
  Add play/pause, mute, fullscreen, quality indicator, source indicator, and retry.
- [ ] **Step 6: Implement error/failover state**
  Fatal source failures advance through candidates without crashing the page; autoplay rejection becomes user action.
- [ ] **Step 7: Run tests and type-check**
  Expected: PASS.
- [ ] **Step 8: Commit**
  Commit message: `feat: add resilient HLS player`

### Task 6: Wire the complete application

**Files:**
- Modify: `components/hidztv-app.tsx`
- Modify: `app/page.tsx`
- Modify: `components/channels/channel-browser.tsx`
- Modify: `components/player/tv-player.tsx`

**Interfaces:**
- The app coordinates selected channel, source loading, retry, and user-facing status.
- Browser selection triggers a new player source session; no global store is required.

- [ ] **Step 1: Add integration tests**
  Verify category/search selection updates visible channels and selecting a channel resets playback session state.
- [ ] **Step 2: Wire source loading**
  Prefer `/api/streams` data and fall back to static channel sources on API failure.
- [ ] **Step 3: Wire player state**
  Render stable loading, live, fallback, empty, and error states.
- [ ] **Step 4: Verify integration**
  Run: `npm run typecheck && npm run build`
  Expected: PASS.
- [ ] **Step 5: Commit**
  Commit message: `feat: wire HidzTv live viewing flow`

### Task 7: Production verification and browser QA

**Files:**
- Modify: `README.md`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- CI runs type-check and production build on pushes/PRs.

- [ ] **Step 1: Update CI**
  Run type-check and build on Node 20+.
- [ ] **Step 2: Start local dev server**
  Run the project dev script.
- [ ] **Step 3: Run browser verification**
  Check desktop and mobile layouts, theme toggle, search, category filters, player UI, retry/failover state, fullscreen, and console errors.
- [ ] **Step 4: Run final production build**
  Expected: PASS with no build errors.
- [ ] **Step 5: Commit**
  Commit message: `chore: add HidzTv production verification`

### Task 8: Deploy and production verification

**Files:**
- No new source files expected; deployment metadata may be adjusted if Vercel configuration requires it.

- [ ] **Step 1: Deploy the rebuilt repository to the existing HidzTv Vercel project when identifiable.**
- [ ] **Step 2: Inspect deployment build logs.**
  Expected: successful production build with no fatal warnings/errors.
- [ ] **Step 3: Browser-check the deployed URL.**
  Verify page loading, responsive layout, theme toggle, channel selection, API responses, and player error handling.
- [ ] **Step 4: Inspect runtime errors.**
  Expected: no new application runtime error clusters attributable to the rebuild.
- [ ] **Step 5: Commit any production-only fixes and redeploy if verification finds a defect.**
