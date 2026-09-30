# HidzTv

HidzTv is the HIDZPROJECT live-TV web app rebuilt from scratch for Next.js, React, TypeScript, Tailwind CSS, HLS.js, and Vercel.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- HLS.js
- Vercel

## UI

Neobrutalism + Y2K with dark/light themes and responsive mobile-first layouts.

## Development

```bash
npm install
npm run dev
```

Production checks:

```bash
npm test
npm run typecheck
npm run build
```

## Branding

The app uses the established HIDZPROJECT logo for favicon and in-app branding. Set `NEXT_PUBLIC_HIDZPROJECT_LOGO` to override the default URL.

## Streams

Channel metadata is stored in `lib/channels.ts`. Sources are treated as external upstreams and can become unavailable independently of the application. The server proxy is allowlisted and only used as a fallback candidate.
