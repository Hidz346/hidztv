import { NextRequest, NextResponse } from 'next/server';
import { CUBMU_PROXY_HEADERS } from '@/lib/cubmu';
import { NANZSTREAM_DIRECT_HOSTS } from '@/lib/nanzstream-tv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOSTS = new Set([
  'servicebuss.transvision.co.id',
  'cdnjktbpid22.transvision.co.id',
  'www.cubmu.com',
  'nanzstream-api.vercel.app',
  ...NANZSTREAM_DIRECT_HOSTS,
]);

function isAllowed(url: URL) {
  return ALLOWED_HOSTS.has(url.hostname) || url.hostname.endsWith('.transvision.co.id');
}

function proxyUrl(origin: string, target: string) {
  return origin + '/api/live-tv/proxy?u=' + encodeURIComponent(target);
}

function bodyLooksLikeManifest(contentType: string, targetUrl: URL) {
  return (
    (!contentType ||
      contentType.includes('text/plain') ||
      contentType.includes('application/octet-stream')) &&
    targetUrl.pathname.toLowerCase().includes('.m3u8')
  );
}

function rewriteManifest(body: string, baseUrl: URL, origin: string) {
  const rewrite = (raw: string) => {
    const value = raw.trim();
    if (!value || value.startsWith('#')) return value;

    try {
      const absolute = new URL(value, baseUrl).toString();
      return proxyUrl(origin, absolute);
    } catch {
      return value;
    }
  };

  return body
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('#') && /URI=/i.test(trimmed)) {
        return trimmed.replace(/URI=(["'])(.*?)\1/i, (_, quote, value) => {
          const absolute = new URL(value, baseUrl).toString();
          return 'URI=' + quote + proxyUrl(origin, absolute) + quote;
        });
      }

      if (!trimmed || trimmed.startsWith('#')) return line;
      return rewrite(line);
    })
    .join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const target = request.nextUrl.searchParams.get('u');
    if (!target) return new NextResponse('Missing stream URL', { status: 400 });

    const targetUrl = new URL(target);
    if (!isAllowed(targetUrl)) {
      return new NextResponse('Upstream host is not allowed', { status: 403 });
    }

    const upstreamHeaders =
      targetUrl.hostname === 'servicebuss.transvision.co.id' ||
      targetUrl.hostname.endsWith('.transvision.co.id') ||
      targetUrl.hostname === 'www.cubmu.com'
        ? CUBMU_PROXY_HEADERS
        : {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
            Accept: '*/*',
          };

    const upstream = await fetch(targetUrl, {
      headers: upstreamHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!upstream.ok || !upstream.body) {
      return new NextResponse('Upstream stream unavailable', {
        status: upstream.status || 502,
      });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const looksLikeManifest =
      contentType.includes('mpegurl') ||
      contentType.includes('application/vnd.apple.mpegurl') ||
      targetUrl.pathname.endsWith('.m3u8') ||
      bodyLooksLikeManifest(contentType, targetUrl);

    if (looksLikeManifest) {
      const body = await upstream.text();
      const rewritten = rewriteManifest(
        body,
        targetUrl,
        request.nextUrl.origin,
      );

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Stream proxy failed';
    return new NextResponse(message, { status: 502 });
  }
}
