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
    if (/^https?:\/\//i.test(trimmed) && (hinted || /\.(m3u8|mpd)(?:[?#]|$)/i.test(trimmed))) {
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

function getChannelNames(value: Record<string, unknown>) {
  return [
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
    'channelId',
    'channel_id',
    'id',
  ]
    .map((key) => normalizeChannelName(value[key]))
    .filter(Boolean);
}

function findExactChannelWithStream(value: unknown, needle: string, depth = 0): Record<string, unknown> | null {
  if (depth > 10 || value == null) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findExactChannelWithStream(item, needle, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof value !== 'object') return null;

  const object = value as Record<string, unknown>;
  const names = getChannelNames(object);

  if (names.some((name) => name === needle)) {
    const urls = collectStreamUrls(object);
    if (urls.length) return object;
  }

  for (const child of Object.values(object)) {
    if (typeof child !== 'object') continue;

    const found = findExactChannelWithStream(child, needle, depth + 1);
    if (found) return found;
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
  const match = findExactChannelWithStream(payload, needle);

  if (!match) throw new Error('Exact channel stream not found');

  const urls = [...new Set(collectStreamUrls(match))];

  if (!urls.length) throw new Error('No HLS source in exact channel match');

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

type PublicIptvEntry = {
  name: string;
  tvgId: string;
  url: string;
};

let publicIptvCache: { expiresAt: number; entries: PublicIptvEntry[] } | null = null;

async function getPublicIptvEntries() {
  if (publicIptvCache && publicIptvCache.expiresAt > Date.now()) {
    return publicIptvCache.entries;
  }

  const response = await fetch('https://iptv-org.github.io/iptv/streams/id.m3u', {
    headers: {
      Accept: 'text/plain,*/*',
      'User-Agent': 'HIDZTV/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) throw new Error('Public IPTV catalogue unavailable');

  const text = await response.text();
  const lines = text.split(/\r?\n/);
  const entries: PublicIptvEntry[] = [];

  let current: { name: string; tvgId: string } | null = null;

  for (const line of lines) {
    const value = line.trim();
    if (!value) continue;

    if (value.startsWith('#EXTINF:')) {
      const comma = value.indexOf(',');
      const attributes = comma >= 0 ? value.slice(0, comma) : value;
      const name = comma >= 0 ? value.slice(comma + 1).trim() : '';

      const tvgId = attributes.match(/tvg-id="([^"]*)"/i)?.[1] ?? '';
      current = { name, tvgId };
      continue;
    }

    if (current && /^https?:\/\//i.test(value)) {
      entries.push({
        name: current.name,
        tvgId: current.tvgId,
        url: value,
      });
      current = null;
    }
  }

  publicIptvCache = {
    expiresAt: Date.now() + 5 * 60 * 1000,
    entries,
  };

  return entries;
}

async function probeManifest(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, */*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
      },
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(7_000),
    });

    if (!response.ok) return false;

    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (type.includes('mpegurl')) return true;

    const text = await response.text();
    return /#EXTM3U/i.test(text);
  } catch {
    return false;
  }
}

async function resolvePublicIptvStream(input: string) {
  const needle = normalize(input);
  if (!needle) return [];

  const entries = await getPublicIptvEntries();

  const candidates = entries.filter((entry) => {
    const name = normalize(entry.name);
    const tvgId = normalize(entry.tvgId);
    const channelId = normalize(input);

    return (
      name === needle ||
      tvgId === needle ||
      tvgId.replace(/\.id\b/g, '') === channelId ||
      (name && channelId && name.includes(channelId) && channelId.length >= 4)
    );
  });

  if (!candidates.length) return [];

  const checks = await Promise.all(
    candidates.slice(0, 5).map(async (entry) => ({
      entry,
      ok: await probeManifest(entry.url),
    })),
  );

  return checks.filter((item) => item.ok).map((item) => item.entry.url);
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
  if (process.env.ENABLE_TRANSVISION_RESOLVER === 'true') {
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
  }

  // Only use recovered APK URLs as a fallback when the live catalogue
  // cannot be resolved.
  const resolvedUrls = [
    ...(staticChannel?.sources ?? []),
    ...(direct ? [direct.stream_url] : []),
  ];

  let publicUrls: string[] = [];
  try {
    publicUrls = await resolvePublicIptvStream(input);
  } catch {}

  const candidateUrls = [...new Set([...publicUrls, ...resolvedUrls])];
  const verifiedUrls: string[] = [];

  for (const url of candidateUrls.slice(0, 6)) {
    if (await probeManifest(url)) verifiedUrls.push(url);
  }

  if (verifiedUrls.length) {
    return NextResponse.json(
      {
        ok: true,
        server: publicUrls.length ? 'public-current-plus-apk' : 'nanzstream-apk-verified',
        channel: staticChannel
          ? {
              id: staticChannel.id,
              channel_id: staticChannel.id,
              channel_name: staticChannel.name,
              channel_number: staticChannel.number,
              genre_name: staticChannel.category,
            }
          : direct,
        manifestUrl: verifiedUrls[0],
        playbackUrl: playbackUrl(origin, verifiedUrls[0]),
        sources: sourceList(origin, verifiedUrls),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

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
