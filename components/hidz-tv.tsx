'use client';

import Hls from 'hls.js';
import {
  Baby,
  ChevronRight,
  CircleUserRound,
  Clapperboard,
  ExternalLink,
  Globe2,
  Heart,
  House,
  Maximize2,
  MonitorPlay,
  Pause,
  Play,
  Search,
  Signal,
  Tv,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_COUNTS, CATEGORY_LABELS, CHANNELS, type Channel, type ChannelCategory } from '@/lib/channels';

type ServerId = 'nanzstream';
type Filter = 'all' | ChannelCategory;

type Profile = {
  id: ServerId;
  label: string;
  note: string;
  sourceIndex: number;
  maxBuffer: number;
  backBuffer: number;
  liveSyncDurationCount: number;
};

const SERVERS: Profile[] = [
  { id: 'nanzstream', label: 'NanzStream', note: 'Source dari APK NanzStream', sourceIndex: 0, maxBuffer: 14, backBuffer: 18, liveSyncDurationCount: 2 },
];

const profileOf = () => SERVERS[0];

function ChannelThumb({ channel }: { channel: Channel }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: channel.color }}>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative z-10 px-2 text-center text-white">
        <div className="text-[8px] font-black tracking-[.25em] opacity-60">HIDZTV</div>
        <div className="mt-1 text-[15px] font-black leading-none">{channel.name}</div>
      </div>
    </div>
  );
}

export default function HidzTV() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('gtv');
  const [server] = useState<ServerId>('nanzstream');
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'fallback' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [sourceNumber, setSourceNumber] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [details, setDetails] = useState(false);
  const [sourceCount, setSourceCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceRef = useRef(0);
  const startedRef = useRef(false);
  const runtimeSourcesRef = useRef<string[]>([]);

  const currentSelected = useMemo(
    () => CHANNELS.find((channel) => channel.id === selectedId) ?? CHANNELS[0],
    [selectedId],
  );

  const visibleChannels = useMemo(() => {
    const value = query.trim().toLowerCase();

    return CHANNELS.filter((channel) => {
      if (!channel.sources.length) return false;
      const categoryMatch = filter === 'all' || channel.category === filter;
      const searchMatch =
        !value ||
        (channel.name + ' ' + channel.region + ' ' + (channel.language ?? '')).toLowerCase().includes(value);

      return categoryMatch && searchMatch;
    });
  }, [filter, query]);

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const destroyHls = () => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  };

  const resetVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    video.onloadedmetadata = null;
    video.oncanplay = null;
    video.onerror = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
  };

  const sourcesFor = (profile: Profile) => {
    const hasRuntimeResolver = runtimeSourcesRef.current.length > 0;
    const available = hasRuntimeResolver ? runtimeSourcesRef.current : currentSelected.sources;
    if (!available.length) return [];

    if (hasRuntimeResolver) {
      return [available[0], ...available.slice(1)];
    }

    return available;
  };

  const loadSource = (url: string, profile: Profile) => {
    const video = videoRef.current;
    if (!video) return;

    startedRef.current = false;
    setStatus(sourceRef.current > 0 ? 'fallback' : 'connecting');
    setMessage(sourceRef.current > 0 ? 'Memindahkan ke source cadangan…' : 'Menghubungkan ke stream…');
    clearTimeoutRef();

    const failed = () => {
      if (startedRef.current) return;

      const sources = sourcesFor(profile);
      const nextIndex = sourceRef.current + 1;

      if (nextIndex < sources.length) {
        sourceRef.current = nextIndex;
        setSourceNumber(nextIndex + 1);
        destroyHls();
        resetVideo();
        loadSource(sources[nextIndex], profile);
        return;
      }

      setStatus('error');
      setMessage('Semua source NanzStream gagal dimuat.');
    };

    timeoutRef.current = setTimeout(failed, 10000);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: profile.backBuffer,
        maxBufferLength: profile.maxBuffer,
        maxBufferHole: 0.8,
        liveSyncDurationCount: profile.liveSyncDurationCount,
        liveMaxLatencyDurationCount: profile.liveSyncDurationCount + 5,
        manifestLoadingTimeOut: 8000,
        levelLoadingTimeOut: 8000,
        fragLoadingTimeOut: 8000,
        manifestLoadingMaxRetry: 1,
        levelLoadingMaxRetry: 1,
        fragLoadingMaxRetry: 2,
      });

      hlsRef.current = hls;

      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(url));
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimeoutRef();
        startedRef.current = true;
        setStatus('live');
        setMessage('');
        video
          .play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level];
        if (level?.height) setQuality(String(level.height) + 'p');
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal || hlsRef.current !== hls) return;

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try {
            hls.recoverMediaError();
            return;
          } catch {
            // Fall through to source failover.
          }
        }

        failed();
      });

      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      const ready = () => {
        clearTimeoutRef();
        startedRef.current = true;
        setStatus('live');
        setMessage('');
        video
          .play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      };

      video.onloadedmetadata = ready;
      video.oncanplay = ready;
      video.onerror = failed;
      video.src = url;
      video.load();
      return;
    }

    failed();
  };

  const loadStream = async () => {
    clearTimeoutRef();
    destroyHls();
    resetVideo();

    sourceRef.current = 0;
    setSourceNumber(1);
    setQuality('Auto');
    setPlaying(false);
    setMessage('');
    runtimeSourcesRef.current = [];
    setSourceCount(currentSelected.sources.length);

    const profile = profileOf(server);
    setStatus('connecting');
    setMessage('Mencari source Live TV…');

    try {
      const response = await fetch('/api/live-tv?channel=' + encodeURIComponent(currentSelected.name), {
        cache: 'no-store',
      });
      const json = (await response.json()) as { ok?: boolean; playbackUrl?: string };

      if (response.ok && json.ok && json.playbackUrl) {
        runtimeSourcesRef.current = [json.playbackUrl, ...currentSelected.sources];
        setSourceCount(runtimeSourcesRef.current.length);
      } else {
        runtimeSourcesRef.current = [...currentSelected.sources];
      }
    } catch {
      runtimeSourcesRef.current = [...currentSelected.sources];
    }

    const sources = sourcesFor(profile);

    if (!sources.length) {
      setStatus('error');
      setMessage('Channel belum memiliki source NanzStream.');
      return;
    }

    loadSource(sources[0], profile);
  };

  useEffect(() => {
    loadStream();

    return () => {
      clearTimeoutRef();
      destroyHls();
      resetVideo();
    };
  }, [selectedId, server]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || status !== 'live') return;

    try {
      if (video.paused) {
        await video.play();
        setPlaying(true);
      } else {
        video.pause();
        setPlaying(false);
      }
    } catch {
      setMessage('Browser menahan autoplay. Tekan play lagi.');
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const toggleFullscreen = async () => {
    if (!playerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await playerRef.current.requestFullscreen();
      }
    } catch {
      setMessage('Fullscreen tidak tersedia pada browser ini.');
    }
  };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#090909]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setFilter('all')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-[#151515] text-white"
            aria-label="Beranda"
          >
            <House size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[19px] font-black">HIDZTV</span>
              <span className="rounded-md bg-white/8 px-2 py-1 text-[9px] font-bold tracking-[.16em] text-zinc-500">LIVE</span>
            </div>
            <p className="truncate text-[11px] text-zinc-500">National & International · 24/7</p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="live-dot h-2.5 w-2.5 rounded-full bg-lime-300" />
            <span className="text-[9px] font-bold tracking-[.16em] text-zinc-500">HLS ACTIVE</span>
          </div>

          <button
            onClick={() => setDetails(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-[#151515] text-zinc-300"
            aria-label="Info"
          >
            <CircleUserRound size={18} />
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pt-6">
        <div ref={playerRef} className="player-shell relative">
          <div className="aspect-video bg-black">
            <video
                ref={videoRef}
                playsInline
                preload="metadata"
                className="h-full w-full object-contain"
            />
          </div>

          <div className="absolute inset-x-0 top-0 flex justify-between bg-gradient-to-b from-black/75 to-transparent p-3 sm:p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-black">LIVE</span>
                <span className="truncate text-[11px] font-semibold">{currentSelected.name}</span>
              </div>
              <div className="mt-1 text-[9px] text-white/55">
                CH {currentSelected.number} · {currentSelected.category === 'national' ? 'Nasional' : currentSelected.region}
              </div>
            </div>

            <div className="flex gap-2 text-[9px] text-white/55">
              <span className="rounded-full bg-black/40 px-2 py-1">{quality}</span>
              <span className="rounded-full bg-black/40 px-2 py-1">SRC {sourceNumber}</span>
            </div>
          </div>

          {(status === 'connecting' || status === 'fallback') && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center p-5">
              <div className="rounded-2xl border border-white/10 bg-black/70 px-5 py-4 text-center backdrop-blur-md">
                <div className="text-[12px] font-semibold">{message}</div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 grid place-items-center bg-black/80 p-5">
              <div className="max-w-sm rounded-2xl border border-red-500/20 bg-[#121212] p-6 text-center">
                <Signal className="mx-auto text-red-400" size={24} />
                <div className="mt-3 text-sm font-bold">Stream direct tidak tersedia</div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Source HLS NanzStream dapat berubah, offline, atau dibatasi oleh server upstream.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button onClick={loadStream} className="rounded-xl bg-white px-4 py-2 text-[11px] font-black uppercase text-black">
                    Coba lagi
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-9 sm:px-4 sm:pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-black disabled:opacity-40"
                disabled={status !== 'live'}
                aria-label="Play/Pause"
              >
                {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>

              <button
                onClick={toggleMute}
                className="hidden h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md disabled:opacity-40 sm:grid"
                disabled={status !== 'live'}
                aria-label="Mute"
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 rounded-full bg-white/8 p-1 md:flex">
                {SERVERS.map((item) => (
                  <span key={item.id} className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-black">
                    {item.label}
                  </span>
                ))}
        </div>

        <div className="mt-6">
          <h2 className="text-[18px] font-black">Daftar Saluran ({visibleChannels.length})</h2>
          <p className="mt-1 text-[10px] text-zinc-500">
            Kategori: {filter === 'all' ? 'Semua' : CATEGORY_LABELS[filter]}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedId(channel.id)}
              className={
                selectedId === channel.id
                  ? 'channel-card flex min-h-[82px] items-center gap-3 p-3 text-left ring-1 ring-white/15'
                  : 'channel-card flex min-h-[82px] items-center gap-3 p-3 text-left'
              }
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
                <ChannelThumb channel={channel} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-black">{channel.name}</div>
                <div className="mt-1 text-[10px] text-zinc-500">
                  CH {channel.number} · {channel.category === 'national' ? 'Nasional' : channel.region}
                </div>
              </div>

              <ChevronRight size={17} className="text-zinc-700" />
            </button>
          ))}
        </div>
      </section>
      {details && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setDetails(false)}
        >
          <div
            className="glass-card w-full max-w-md rounded-3xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-lg font-black">HIDZTV</div>
            <p className="mt-1 text-xs text-zinc-500">Next.js · HLS.js · Vercel</p>

            <div className="mt-5 space-y-3 text-xs text-zinc-400">
              <div className="rounded-2xl border border-white/8 p-4">
                Lite, Fast dan Max menggunakan profile buffer/latency yang berbeda pada HLS.
              </div>
              <div className="rounded-2xl border border-white/8 p-4">
                HidzTV hanya menggunakan source Live TV yang ditemukan dari APK NanzStream.
              </div>
              <div className="rounded-2xl border border-white/8 p-4">
                Ketersediaan siaran tetap bergantung pada server HLS upstream dan perubahan URL.
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="pb-10 text-center text-[9px] uppercase tracking-[.16em] text-zinc-700">
        HIDZTV · 2026 · NANZSTREAM APK LIVE SOURCES
      </footer>
    </main>
  );
}
