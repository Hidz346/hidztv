# HIDZTV

HIDZTV is a Next.js live-TV frontend rebuilt from the existing `Hidz346/hidztv` project while keeping the existing stream-catalogue concept and dark mobile-first visual direction.

## Stack

- Next.js 16.3
- React 19
- TypeScript
- Tailwind CSS 4
- HLS.js
- Lucide React
- Vercel deployment

## Player

The player exposes four playback profiles:

- **Lite** — smaller buffer target for lower bandwidth.
- **Fast** — balanced startup and buffering.
- **Max** — deeper buffer target for less stable connections.
- **Embed** — uses a channel-specific provider URL when `embedUrl` exists.

For HLS channels with more than one source, the selected profile determines the preferred source and the player automatically falls back to the next configured source when the first source fails before playback starts.

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

Vercel detects the Next.js application from `package.json`.

## Stream availability

The live URLs in `lib/channels.ts` are external upstream endpoints. Their uptime, CORS policy, regional availability, bitrate and actual buffering behaviour are controlled by the upstream provider. HIDZTV therefore uses resilient client-side playback settings and source failover, but cannot guarantee a permanently buffer-free external stream.
