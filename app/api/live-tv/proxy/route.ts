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

const MAX_REDIRECTS = 3;

function isAllowed(url: URL) {
  return ALLOWED_HOSTS.has(url.hostname) || url.hostname.endsWith('.transvision.co.id');
}

function proxyUrl(origin: string, target: string) {
  return origin + '/api/live-tv/proxy?u=' + encodeURIComponent(target);
}

function looksLikeManifest(contentType: string, targetUrl: URL) {
  const type = contentType.toLowerCase();
  const pathLooksLikeManifest = targetUrl.pathname.toLowerCase().includes('.m3u8');
  const genericText = type.includes('text/plain') || type.includes('application/octet-stream');

  return (
    type.includes('mpegurl') ||
    type.includes('vnd.apple.mpegurl') ||
    pathLooksLikeManifest ||
    (genericText && pathLooksLikeManifest)
  );
}

function rewriteManifest(body: string, baseUrl: URL, origin: string) {
  const rewrite = (raw: string) => {
    const value = raw.trim();
    if (!value || value.startsWith('#')) return value;

    try {
      const absolute = new URL(value, baseUrl);
      if (!isAllowed(absolute)) return value;
      return proxyUrl(origin, absolute.toString());
    } catch {
      return value;
    }
  };

  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('#') && /URI=/i.test(trimmed)) {
        return trimmed.replace(/URI=(["'])(.*?)\1/i, (_, quote, value) => {
          try {
            const absolute = new URL(value, baseUrl);
            if (!isAllowed(absolute)) return 'URI=' + quote + value + quote;
            return 'URI=' + quote + proxyUrl(origin, absolute.toString()) + quote;
          } catch {
            return 'URI=' + quote + value + quote;
          }
        });
      }

      if (!trimmed || trimmed.startsWith('#')) return line;
      return rewrite(line);
    })
    .join('\n');
}

async function fetchAllowed(url: URL, headers: HeadersInit) {
  let current = new URL(url);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    if (!isAllowed(current)) {
      throw new Error('Redirected stream host is not allowed');
    }

    const response = await fetch(current, {
      headers,
      cache: 'no-store',
      redirect: 'manual',
    });

    if (response.status < 300 || response.status >= 400) {
      return { response, finalUrl: current };
    }

    const location = response.headers.get('location');
    if (!location) {
      return { response, finalUrl: current };
    }

    current = new URL(location, current);
  }

  throw new Error('Too many upstream redirects');
}

function corsHeaders(contentType: string) {
  return {
    'Content-Type': contentType,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders('text/plain; charset=utf-8'),
  });
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

    const { response: upstream, finalUrl } = await fetchAllowed(targetUrl, upstreamHeaders);

    if (!upstream.ok || !upstream.body) {
      return new NextResponse('Upstream stream unavailable', {
        status: upstream.status || 502,
        headers: corsHeaders('text/plain; charset=utf-8'),
      });
    }

    const contentType = upstream.headers.get('content-type') || '';

    if (looksLikeManifest(contentType, finalUrl)) {
      const body = await upstream.text();
      const rewritten = rewriteManifest(body, finalUrl, request.nextUrl.origin);

      return new NextResponse(rewritten, {
        status: 200,
        headers: corsHeaders('application/vnd.apple.mpegurl'),
      });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: corsHeaders(contentType || 'application/octet-stream'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stream proxy failed';
    return new NextResponse(message, {
      status: 502,
      headers: corsHeaders('text/plain; charset=utf-8'),
    });
  }
}
