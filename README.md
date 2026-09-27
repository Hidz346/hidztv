# HIDZTV

HIDZTV is a Next.js Live TV web application using the 52-channel catalogue already present in the project and the Live TV sources recovered from the supplied NanzStream v1.3.35 APK.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- HLS.js
- Lucide React
- Vercel

## Live TV

The catalogue contains 52 channels:

- Nasional: 25
- Internasional: 7
- Hiburan & Sport: 9
- Kids: 7
- Religi: 4

The recovered NanzStream APK provides a direct HLS catalogue for 25 named channels. Those URLs are kept in `lib/nanzstream-tv.ts` and `lib/apk-streams.ts`. Additional URLs recovered from the APK are retained only when their channel association is known; HIDZTV does not guess an association for an unidentified stream.

## Playback architecture

```
HIDZTV channel
    ↓
/api/live-tv
    ↓
NanzStream APK source resolver
    ↓
HIDZTV HLS proxy
    ↓
HLS.js
    ↓
HTML5 video
```

For channels with a recovered direct source, the browser requests the same-origin HIDZTV proxy first and keeps the original HLS URL as a last-resort fallback. HLS manifests are rewritten so relative playlists, segments, and key/URI resources continue through the proxy.

The proxy uses an explicit upstream-host allowlist, validates redirects, adds CORS headers, and avoids exposing provider credentials to the browser.

## Optional CubMu fallback

The existing CubMu resolver remains available only when both server-side variables are configured:

- `CUBMU_EMAIL`
- `CUBMU_PASSWORD`

These variables are never sent to the client. If they are not configured, the application remains NanzStream-first and simply reports that no recovered source exists for an unresolved channel.

## Development

```bash
npm install
npm run dev
```

Run the production build locally before publishing:

```bash
npm run lint
npm run build
npm start
```

## Vercel

The repository already contains `vercel.json` configured for Next.js. Vercel can deploy the `main` branch directly.

No client-side environment variable is required for the NanzStream APK source catalogue.

## Source availability

A URL recovered from an APK is evidence that the URL existed in that APK; it is not a guarantee that the upstream server is still online or that the stream is playable from every network. Upstream HLS URLs can expire, change, require special headers, be geo-restricted, or be taken offline.

HIDZTV therefore treats upstream availability separately from application readiness: the application, resolver, proxy, failover logic, and deployment configuration are prepared for production, while the continued availability of third-party upstream streams remains outside HIDZTV's control.
