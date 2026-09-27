import { NextRequest, NextResponse } from 'next/server';
import { resolveCubMuStream, getCubMuChannels } from '@/lib/cubmu';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('channel')?.trim();

    if (!input) {
      return NextResponse.json({ ok: true, channels: await getCubMuChannels() });
    }

    const resolved = await resolveCubMuStream(input);
    const origin = new URL(request.url).origin;
    const proxyUrl = origin + '/api/live-tv/proxy?u=' + encodeURIComponent(resolved.manifestUrl);

    return NextResponse.json({
      ok: true,
      channel: resolved.channel,
      manifestUrl: resolved.manifestUrl,
      playbackUrl: proxyUrl,
      server: 'cubmu-primary',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Live TV resolver failed';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
