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

function collectStreamUrls(value: unknown, out: string[] = [], depth = 0, hinted = false): string[] {
  if (depth > 8 || value == null) return out;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed) && /\.(m3u8|mpd)(?:[?#]|$)/i.test(trimmed)) {
      out.push(trimmed);
    }
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectStreamUrls(item, out, depth + 1);
    return out;
  }

  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (/^(url|stream|stream_url|streamUrl|playback|playback_url|playbackUrl|manifest|manifest_url|manifestUrl|hls|hls_url|hlsUrl|source|source_url|sourceUrl|play_url|playUrl)$/i.test(key)) {
        collectStreamUrls(child, out, depth + 1, /^(url|stream|stream_url|streamUrl|playback|playback_url|playbackUrl|manifest|manifest_url|manifestUrl|hls|hls_url|hlsUrl|source|source_url|sourceUrl|play_url|playUrl)$/i.test(key));
      } else if (typeof child === 'object') {
        collectStreamUrls(child, out, depth + 1);
      }
    }
  }

  return out;
}

function findMatchingChannel(value: unknown, needle: string, depth = 0): unknown {
  if (depth > 8 || value == null) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findMatchingChannel(item, needle, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const nameFields = ['name', 'channel_name', 'channelName', 'title', 'display_name', 'displayName'];
    const names = nameFields
      .map((key) => object[key])
      .filter((item): item is string => typeof item === 'string')
      .map(normalizeChannelName);

    if (names.some((name) => name === needle || name.includes(needle) || needle.includes(name))) {
      return object;
    }

    for (const child of Object.values(object)) {
      if (typeof child === 'object') {
        const found = findMatchingChannel(child, needle, depth + 1);
        if (found) return found;
      }
    }
  }

  return null;
}

async function resolveTransvisionStream(input: string) {
  const needle = normalizeChannelName(input);

  const response = await fetch(
    'https://servicebuss.transvision.co.id/global/v4/channel-list?page=1&per_page=50&platform_id=1',
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

  if (!response.ok) throw new Error('Transvision channel list unavailable');

  const payload = await response.json();
  const match = findMatchingChannel(payload, needle);
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

  const resolvedUrls = [
    ...(staticChannel?.sources ?? []),
    ...(direct ? [direct.stream_url] : []),
  ];

  if (resolvedUrls.length) {
    const uniqueUrls = [...new Set(resolvedUrls)];
    return NextResponse.json(
      {
        ok: true,
        server: 'nanzstream-apk',
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
