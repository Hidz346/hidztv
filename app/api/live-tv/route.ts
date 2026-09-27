import { NextRequest, NextResponse } from 'next/server';
import { resolveCubMuStream } from '@/lib/cubmu';
import { CHANNELS } from '@/lib/channels';
import { getNanzStreamTvChannels, resolveNanzStreamDirect } from '@/lib/nanzstream-tv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function playbackUrl(origin: string, streamUrl: string) {
  return origin + '/api/live-tv/proxy?u=' + encodeURIComponent(streamUrl);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/hd\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolveStaticChannel(input: string) {
  const needle = normalize(input);
  if (!needle) return null;

  const exact = CHANNELS.find((channel) => {
    const candidates = [channel.id, channel.name].map(normalize);
    return candidates.includes(needle);
  });

  if (exact) return exact;

  return CHANNELS.find((channel) => {
    const name = normalize(channel.name);
    const id = normalize(channel.id);
    return Boolean(needle) && (name.includes(needle) || needle.includes(name) || id.includes(needle));
  }) ?? null;
}



function normalizeChannelName(value: unknown) {
  return typeof value === 'string' ? normalize(value) : '';
}

const STREAM_KEYS = /^(url|stream|stream_url|streamUrl|playback|playback_url|playbackUrl|manifest|manifest_url|manifestUrl|hls|hls_url|hlsUrl|source|source_url|sourceUrl|play_url|playUrl|directHlsUrl|direct_hls_url|backupUrl|backup_url|src)$/i;
const CHANNEL_NAME_KEYS = [
  'channelTitle',
  'channel_title',
  'channelName',
  'channel_name',
  'displayName',
  'display_name',
  'shortName',
  'short_name',
  'name',
  'title',
  'slug',
];

function collectStreamUrls(value: unknown, out: string[] = [], depth = 0, hinted = false): string[] {
  if (depth > 8 || value == null) return out;

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (
      /^https?:\/\//i.test(trimmed) &&
      (
        hinted ||
        /\.(m3u8|mpd)(?:[?#]|$)/i.test(trimmed) ||
        /\/((hls|live|stream|playlist|manifest))(?:\/|[?#]|$)/i.test(trimmed)
      )
    ) {
      out.push(trimmed);
    }

    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectStreamUrls(item, out, depth + 1, hinted);
    return out;
  }

  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (STREAM_KEYS.test(key)) {
        collectStreamUrls(child, out, depth + 1, true);
      } else if (typeof child === 'object') {
        collectStreamUrls(child, out, depth + 1, false);
      }
    }
  }

  return out;
}

function scoreChannelMatch(object: Record<string, unknown>, needle: string) {
  if (!needle) return 0;

  let best = 0;

  for (const key of CHANNEL_NAME_KEYS) {
    const value = normalizeChannelName(object[key]);
    if (!value || value.length < 3) continue;

    if (value === needle) best = Math.max(best, key === 'channelTitle' || key === 'channelName' || key === 'channel_name' ? 120 : 110);
    else if (needle === value.replace(/\b(tv|televisi)\b/g, '').trim()) best = Math.max(best, 100);
    else if (value.includes(needle) && needle.length >= 4) best = Math.max(best, 80);
    else if (needle.includes(value) && value.length >= 4) best = Math.max(best, 70);
  }

  for (const key of ['channelId', 'channel_id', 'id', 'slug']) {
    const value = normalizeChannelName(object[key]);
    if (value && value === needle) best = Math.max(best, 130);
  }

  return best;
}

function findBestMatchingChannel(value: unknown, needle: string, depth = 0): Record<string, unknown> | null {
  if (depth > 10 || value == null) return null;

  let best: { score: number; object: Record<string, unknown> } | null = null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = findBestMatchingChannel(item, needle, depth + 1);
      if (!candidate) continue;

      const score = scoreChannelMatch(candidate, needle);
      if (!best || score > best.score) best = { score, object: candidate };
    }

    return best?.object ?? null;
  }

  if (typeof value !== 'object') return null;

  const object = value as Record<string, unknown>;
  const ownScore = scoreChannelMatch(object, needle);

  if (ownScore > 0) {
    best = { score: ownScore, object };
  }

  for (const child of Object.values(object)) {
    if (typeof child !== 'object') continue;

    const candidate = findBestMatchingChannel(child, needle, depth + 1);
    if (!candidate) continue;

    const childScore = scoreChannelMatch(candidate, needle);
    if (!best || childScore > best.score) best = { score: childScore, object: candidate };
  }

  return best?.object ?? null;
}

async function fetchTransvisionPage(page: number) {
  const response = await fetch(
    `https://servicebuss.transvision.co.id/global/v4/channel-list?page=${page}&per_page=50&platform_id=1`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'NanzStream/1.3.35',
        Referer: 'https://www.cubmu.com/',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) throw new Error(`Transvision page ${page} unavailable`);
  return response.json();
}

async function resolveTransvisionStream(input: string) {
  const needle = normalizeChannelName(input);

  const payloads = await Promise.allSettled([
    fetchTransvisionPage(1),
    fetchTransvisionPage(2),
  ]);

  const payload = payloads
    .filter((item): item is PromiseFulfilledResult<unknown> => item.status === 'fulfilled')
    .map((item) => item.value);

  if (!payload.length) throw new Error('Transvision channel list unavailable');

  const match = payload.reduce<Record<string, unknown> | null>((best, current) => {
    const candidate = findBestMatchingChannel(current, needle);
    if (!candidate) return best;

    if (!best) return candidate;

    return scoreChannelMatch(candidate, needle) > scoreChannelMatch(best, needle)
      ? candidate
      : best;
  }, null);

  if (!match) throw new Error('Channel not found in Transvision catalogue');

  const urls = [...new Set(collectStreamUrls(match))];

  if (!urls.length) throw new Error('No HLS source in matched Transvision channel');

  return {
    channel: match,
    urls,
  };
}

function sourceList(origin: string, urls: string[]) {
  return [...new Set(urls.filter(Boolean))].flatMap((url) => [
    playbackUrl(origin, url),
    url,
  ]);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('channel')?.trim();
  const origin = new URL(request.url).origin;

  if (!input) {
    const direct = getNanzStreamTvChannels();
    const byName = new Map(direct.map((channel) => [normalize(channel.channel_name), channel.stream_url]));

    const channels = CHANNELS.map((channel) => {
      const directUrl = byName.get(normalize(channel.name));
      const urls = [...channel.sources, ...(directUrl ? [directUrl] : [])];
      return {
        ...channel,
        playbackUrl: urls[0] ? playbackUrl(origin, urls[0]) : undefined,
        sources: sourceList(origin, urls),
      };
    });

    return NextResponse.json(
      { ok: true, server: 'nanzstream-apk', channels },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const staticChannel = resolveStaticChannel(input);
  const direct = resolveNanzStreamDirect(input);

  // NanzStream's APK uses the Transvision channel-list API for the live
  // catalogue. Prefer that dynamic resolver over recovered static URLs:
  // static HLS addresses can remain present while already being offline.
  try {
    const resolved = await resolveTransvisionStream(input);
    const uniqueUrls = [...new Set(resolved.urls)];

    return NextResponse.json(
      {
        ok: true,
        server: 'transvision-channel-api',
        channel: resolved.channel,
        manifestUrl: uniqueUrls[0],
        playbackUrl: playbackUrl(origin, uniqueUrls[0]),
        sources: sourceList(origin, uniqueUrls),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {}

  // Only use recovered APK URLs as a fallback when the live catalogue
  // cannot be resolved.
  const resolvedUrls = [
    ...(staticChannel?.sources ?? []),
    ...(direct ? [direct.stream_url] : []),
  ];

  if (resolvedUrls.length) {
    const uniqueUrls = [...new Set(resolvedUrls)];
    return NextResponse.json(
      {
        ok: true,
        server: 'nanzstream-apk-fallback',
        channel: staticChannel
          ? {
              id: staticChannel.id,
              channel_id: staticChannel.id,
              channel_name: staticChannel.name,
              channel_number: staticChannel.number,
              genre_name: staticChannel.category,
            }
          : direct,
        manifestUrl: uniqueUrls[0],
        playbackUrl: playbackUrl(origin, uniqueUrls[0]),
        sources: sourceList(origin, uniqueUrls),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (process.env.CUBMU_EMAIL && process.env.CUBMU_PASSWORD) {
    try {
      const resolved = await resolveCubMuStream(input);
      return NextResponse.json(
        {
          ok: true,
          server: 'cubmu-fallback',
          channel: resolved.channel,
          manifestUrl: resolved.manifestUrl,
          playbackUrl: playbackUrl(origin, resolved.manifestUrl),
          sources: sourceList(origin, [resolved.manifestUrl]),
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    } catch {}
  }

  return NextResponse.json(
    {
      ok: false,
      server: 'nanzstream-apk',
      error: 'Channel source tidak ditemukan pada katalog source yang tersedia.',
    },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  );
}
