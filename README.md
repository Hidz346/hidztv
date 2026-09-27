# HIDZTV

HIDZTV is a Next.js live-TV web application rebuilt from the existing project and aligned with the 52-channel layout shown in the supplied NanzStream APK reference.

## Stack

- Next.js 16.3
- React 19
- TypeScript
- Tailwind CSS 4
- HLS.js
- Lucide React
- Vercel

## Live TV catalogue

The web catalogue now contains 52 channels split into:

- Nasional: 25
- Internasional: 7
- Hiburan & Sport: 9
- Kids: 7
- Religi: 4

The direct stream entries in lib/apk-streams.ts were extracted from the supplied NanzStream v1.3.35 APK. The website does not invent replacement stream URLs when the APK does not expose a stable direct source for a channel.

For channels without a usable direct source, HIDZTV keeps an official/provider URL as fallback. This is intentional: a browser cannot reliably reproduce Android-native playback behavior or upstream request headers that a provider may require.

## Player servers

- Lite — lower buffer target.
- Fast — balanced startup/buffering.
- Max — deeper buffer target and preferred alternate source when available.
- Embed — provider page fallback.

The direct HLS path performs source failover before falling back to the provider URL.

## Development

~~~bash
npm install
npm run dev
~~~

## Production

~~~bash
npm run build
npm start
~~~

Vercel detects the project as a Next.js application.

## Source availability

A live URL can stop working because of upstream changes, CORS, geo restrictions, expiring tokens, referer requirements, or provider-side downtime. Those conditions are outside HIDZTV and are handled with source failover/provider fallback where possible.
