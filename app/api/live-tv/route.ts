import { NextRequest, NextResponse } from 'next/server';
import { resolveNanzStreamTv } from '@/lib/nanzstream-tv';
import { resolveCubMuStream, getCubMuChannels } from '@/lib/cubmu';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('channel')?.trim();

  if (!input) {
    try {
      return NextResponse.json({ ok: true, channels: await getCubMuChannels() });
    } catch {
      return NextResponse.json({ ok: true, channels: [] });
    }
  }

  // NanzStream is the primary source. The API base URL is recovered from
  // the supplied NanzStream APK; the adapter tolerates the known TV route
  // variants without hard-coding a single response schema.
  const nanz = await resolveNanzStreamTv(input);

  if (nanz.ok) {
    let playbackUrl = nanz.playbackUrl;

    try {
      const upstream = new URL(nanz.playbackUrl);
      if (upstream.hostname === 'nanzstream-api.vercel.app') {
        const origin = new URL(request.url).origin;
        playbackUrl = origin + '/api/live-tv/proxy?u=' + encodeURIComponent(nanz.playbackUrl);
      }
    } catch {
      // Leave the API response untouched; the player will handle it as a normal source.
    }

    return NextResponse.json({
      ok: true,
      playbackUrl,
      server: 'nanzstream-primary',
      endpoint: nanz.endpoint,
    });
  }

  // Keep the existing CubMu resolver as a compatibility fallback so a
  // temporary NanzStream API outage does not break the whole TV player.
  try {
    const resolved = await resolveCubMuStream(input);
    const origin = new URL(request.url).origin;
    const proxyUrl = origin + '/api/live-tv/proxy?u=' + encodeURIComponent(resolved.manifestUrl);

    return NextResponse.json({
      ok: true,
      channel: resolved.channel,
      manifestUrl: resolved.manifestUrl,
      playbackUrl: proxyUrl,
      server: 'cubmu-fallback',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Live TV resolver failed';
    return NextResponse.json({
      ok: false,
      error: message,
      nanzstream: {
        attempted: nanz.attempted,
      },
    }, { status: 502 });
  }
}
