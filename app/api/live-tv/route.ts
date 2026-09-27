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
