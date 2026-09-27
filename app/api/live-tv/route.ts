import { NextRequest, NextResponse } from 'next/server';
import {
  getNanzStreamTvChannels,
  resolveNanzStreamDirect,
} from '@/lib/nanzstream-tv';
import { resolveCubMuStream } from '@/lib/cubmu';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('channel')?.trim();
  const origin = new URL(request.url).origin;

  if (!input) {
    return NextResponse.json({
      ok: true,
      channels: getNanzStreamTvChannels().map((channel) => ({
        ...channel,
        playbackUrl:
          origin +
          '/api/live-tv/proxy?u=' +
          encodeURIComponent(channel.stream_url),
      })),
      server: 'nanzstream-apk',
    });
  }

  const direct = resolveNanzStreamDirect(input);

  if (direct) {
    const playbackUrl =
      origin +
      '/api/live-tv/proxy?u=' +
      encodeURIComponent(direct.stream_url);

    return NextResponse.json({
      ok: true,
      channel: direct,
      manifestUrl: direct.stream_url,
      playbackUrl,
      server: 'nanzstream-apk',
    });
  }

  // Keep the existing CubMu resolver as a fallback for channels that are
  // not present in the recovered NanzStream Live TV catalogue.
  try {
    const resolved = await resolveCubMuStream(input);
    const proxyUrl =
      origin +
      '/api/live-tv/proxy?u=' +
      encodeURIComponent(resolved.manifestUrl);

    return NextResponse.json({
      ok: true,
      channel: resolved.channel,
      manifestUrl: resolved.manifestUrl,
      playbackUrl: proxyUrl,
      server: 'cubmu-fallback',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Live TV resolver failed';

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 502 },
    );
  }
}
