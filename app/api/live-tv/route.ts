import { NextRequest, NextResponse } from 'next/server';
import { getNanzStreamTvChannels, resolveNanzStreamDirect } from '@/lib/nanzstream-tv';
import { resolveCubMuStream } from '@/lib/cubmu';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function playbackUrl(origin: string, streamUrl: string) {
  return origin + '/api/live-tv/proxy?u=' + encodeURIComponent(streamUrl);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('channel')?.trim();
  const origin = new URL(request.url).origin;

  if (!input) {
    const channels = getNanzStreamTvChannels().map((channel) => ({
      ...channel,
      playbackUrl: playbackUrl(origin, channel.stream_url),
    }));

    return NextResponse.json(
      { ok: true, server: 'nanzstream-apk', channels },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const direct = resolveNanzStreamDirect(input);

  if (direct) {
    return NextResponse.json(
      {
        ok: true,
        server: 'nanzstream-apk',
        channel: direct,
        manifestUrl: direct.stream_url,
        playbackUrl: playbackUrl(origin, direct.stream_url),
        sources: [playbackUrl(origin, direct.stream_url), direct.stream_url],
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // CubMu is optional. It is only attempted when credentials exist, so a
  // clean NanzStream-only deployment does not fail because of missing secrets.
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
          sources: [playbackUrl(origin, resolved.manifestUrl), resolved.manifestUrl],
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    } catch {
      // Fall through to a stable 404 response below.
    }
  }

  return NextResponse.json(
    {
      ok: false,
      server: 'nanzstream-apk',
      error: 'Channel source tidak ditemukan pada katalog source yang dipulihkan dari APK.',
    },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  );
}
