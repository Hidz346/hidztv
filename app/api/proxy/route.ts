import { NextResponse } from "next/server";
import { isSupportedStreamUrl } from "@/lib/stream-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function allowedHost(hostname: string) {
  const hosts = new Set(
    [
      "mncmedia.malingtv.workers.dev",
      "live.rctiplus.id",
      "video.detik.com",
      "live.i-news.tv",
      "op-group1-swiftservehd-1.dens.tv",
      "live.cnnindonesia.com",
      "live.cnbcindonesia.com",
      ...(process.env.HIDZTV_PROXY_HOSTS ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ].map((value) => value.toLowerCase()),
  );

  return hosts.has(hostname.toLowerCase());
}

function proxyUrl(requestUrl: string, target: string) {
  return new URL("/api/proxy?u=" + encodeURIComponent(target), requestUrl).toString();
}

function rewriteManifest(text: string, base: string, requestUrl: string) {
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (!line.trim()) return line;

      if (line.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
          try {
            const target = new URL(uri, base).toString();
            return 'URI="' + proxyUrl(requestUrl, target) + '"';
          } catch {
            return 'URI="' + uri + '"';
          }
        });
      }

      try {
        const target = new URL(line.trim(), base).toString();
        return proxyUrl(requestUrl, target);
      } catch {
        return line;
      }
    })
    .join("\n");
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("u");

  if (!target || !isSupportedStreamUrl(target)) {
    return NextResponse.json({ error: "invalid upstream URL" }, { status: 400 });
  }

  const upstreamUrl = new URL(target);

  if (!allowedHost(upstreamUrl.hostname)) {
    return NextResponse.json({ error: "upstream host is not allowlisted" }, { status: 403 });
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "*/*",
        "User-Agent": "HidzTv/3.0",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream request failed", status: upstream.status },
        { status: 502 },
      );
    }

    const type = upstream.headers.get("content-type") ?? "application/octet-stream";
    const isManifest =
      type.includes("mpegurl") ||
      type.includes("vnd.apple.mpegurl") ||
      upstreamUrl.pathname.toLowerCase().endsWith(".m3u8");

    if (isManifest) {
      const body = await upstream.text();

      return new Response(
        rewriteManifest(body, upstream.url || upstreamUrl.toString(), requestUrl.toString()),
        {
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "upstream connection failed" }, { status: 502 });
  }
}
