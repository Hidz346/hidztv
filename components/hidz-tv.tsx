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
  Settings2,
  Signal,
  Tv,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_COUNTS, CATEGORY_LABELS, CHANNELS, type Channel, type ChannelCategory } from '@/lib/channels';

type ServerId = 'lite' | 'fast' | 'max' | 'embed';
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
  { id: 'lite', label: 'Lite', note: 'Hemat data', sourceIndex: 0, maxBuffer: 9, backBuffer: 12, liveSyncDurationCount: 2 },
  { id: 'fast', label: 'Fast', note: 'Cepat mulai', sourceIndex: 0, maxBuffer: 14, backBuffer: 18, liveSyncDurationCount: 2 },
  { id: 'max', label: 'Max', note: 'Buffer tebal', sourceIndex: 1, maxBuffer: 28, backBuffer: 45, liveSyncDurationCount: 3 },
  { id: 'embed', label: 'Embed', note: 'Provider resmi', sourceIndex: 0, maxBuffer: 14, backBuffer: 18, liveSyncDurationCount: 3 },
];

const profileOf = (id: ServerId) => SERVERS.find((item) => item.id === id) ?? SERVERS[1];

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
  const [server, setServer] = useState<ServerId>('fast');
  const [serverSheet, setServerSheet] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'fallback' | 'error' | 'embed'>('idle');
  const [message, setMessage] = useState('');
  const [sourceNumber, setSourceNumber] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [details, setDetails] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceRef = useRef(0);
  const startedRef = useRef(false);

  const currentSelected = useMemo(
    () => CHANNELS.find((channel) => channel.id === selectedId) ?? CHANNELS[0],
    [selectedId],
  );

  const visibleChannels = useMemo(() => {
    const value = query.trim().toLowerCase();

    return CHANNELS.filter((channel) => {
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

  const openProvider = () => {
    if (currentSelected.providerUrl) {
      window.open(currentSelected.providerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const providerPlayback = () => {
    clearTimeoutRef();
    destroyHls();
    resetVideo();
    setPlaying(false);
    setQuality('Provider');
    setStatus('embed');
    setMessage('');
  };

  const sourcesFor = (profile: Profile) => {
    if (!currentSelected.sources.length) return [];

    const preferredIndex = Math.min(profile.sourceIndex, currentSelected.sources.length - 1);
    return [
      currentSelected.sources[preferredIndex],
      ...currentSelected.sources.filter((_, index) => index !== preferredIndex),
    ];
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

      if (currentSelected.providerUrl) {
        providerPlayback();
      } else {
        setStatus('error');
        setMessage('Semua sumber stream gagal dimuat.');
      }
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

  const loadStream = () => {
    clearTimeoutRef();
    destroyHls();
    resetVideo();

    sourceRef.current = 0;
    setSourceNumber(1);
    setQuality('Auto');
    setPlaying(false);
    setMessage('');

    if (server === 'embed') {
      if (currentSelected.providerUrl) {
        providerPlayback();
      } else {
        setStatus('error');
        setMessage('Provider resmi belum tersedia untuk channel ini.');
      }
      return;
    }

    const profile = profileOf(server);
    const sources = sourcesFor(profile);

    if (!sources.length) {
      if (currentSelected.providerUrl) {
        providerPlayback();
      } else {
        setStatus('error');
        setMessage('Channel belum memiliki sumber playback.');
      }
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

  const embedMode = status === 'embed' && Boolean(currentSelected.providerUrl);

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
            {embedMode ? (
              <iframe
                key={currentSelected.providerUrl}
                src={currentSelected.providerUrl}
                title={currentSelected.name + ' provider'}
                className="h-full w-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                preload="metadata"
                className="h-full w-full object-contain"
              />
            )}
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
              {!embedMode && <span className="rounded-full bg-black/40 px-2 py-1">SRC {sourceNumber}</span>}
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
                  Source eksternal dapat berubah, offline, terkena CORS, atau dibatasi provider.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button onClick={loadStream} className="rounded-xl bg-white px-4 py-2 text-[11px] font-black uppercase text-black">
                    Coba lagi
                  </button>
                  {currentSelected.providerUrl && (
                    <button
                      onClick={openProvider}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#1b1b1b] px-4 py-2 text-[11px] font-black uppercase text-white"
                    >
                      <ExternalLink size={13} />
                      Provider resmi
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {embedMode && (
            <div className="absolute inset-x-0 bottom-12 flex justify-center px-4 sm:bottom-16">
              <button
                onClick={openProvider}
                className="inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-[10px] font-black uppercase tracking-[.12em] text-white backdrop-blur-md"
              >
                <ExternalLink size={13} /> Buka provider
              </button>
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
                  <button
                    key={item.id}
                    onClick={() => setServer(item.id)}
                    className={
                      server === item.id
                        ? 'rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-black'
                        : 'rounded-full px-3 py-1.5 text-[10px] font-bold text-white/60'
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setServerSheet(true)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white md:hidden"
                aria-label="Pilih server"
              >
                <Settings2 size={16} />
              </button>

              <button
                onClick={toggleFullscreen}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
                aria-label="Fullscreen"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[9px] uppercase tracking-[.14em] text-zinc-500">
          <span className="rounded-full border border-white/8 bg-[#101010] px-3 py-1.5">Server {profileOf(server).label}</span>
          <span className="rounded-full border border-white/8 bg-[#101010] px-3 py-1.5">{profileOf(server).note}</span>
          <span className="rounded-full border border-white/8 bg-[#101010] px-3 py-1.5">
            {currentSelected.sources.length ? 'Source ' + sourceNumber + '/' + currentSelected.sources.length : 'Provider resmi'}
          </span>
        </div>

        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-black">{currentSelected.name}</h1>
            <p className="mt-1 text-[11px] text-zinc-500">
              CH {currentSelected.number} · {currentSelected.category === 'national' ? 'Nasional' : currentSelected.region}
            </p>
          </div>

          {currentSelected.providerUrl && (
            <button
              onClick={openProvider}
              className="hidden shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-[10px] font-bold text-zinc-300 sm:flex"
            >
              <ExternalLink size={13} /> Provider
            </button>
          )}
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 hidz-scrollbar">
          {SERVERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setServer(item.id)}
              className={
                server === item.id
                  ? 'shrink-0 rounded-full border border-white bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-black'
                  : 'shrink-0 rounded-full border border-white/10 bg-[#131313] px-4 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-zinc-400'
              }
            >
              Server {item.label}
            </button>
          ))}
        </div>

        <div className="relative mt-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari saluran (contoh: GTV, SCTV, CNN)…"
            className="h-12 w-full rounded-2xl border border-white/10 bg-[#141414] pl-11 pr-4 text-[12px] outline-none placeholder:text-zinc-600 focus:border-white/20"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 hidz-scrollbar">
          {[
            ['all', 'Semua', Tv],
            ['national', 'Nasional', MonitorPlay],
            ['international', 'Internasional', Globe2],
            ['entertainment', 'Hiburan & Sport', Clapperboard],
            ['kids', 'Kids', Baby],
            ['religion', 'Religi', Heart],
          ].map(([id, label, Icon]) => {
            const IconComponent = Icon as typeof Tv;
            const count = CATEGORY_COUNTS[id as keyof typeof CATEGORY_COUNTS];

            return (
              <button
                key={String(id)}
                onClick={() => setFilter(id as Filter)}
                className={
                  filter === id
                    ? 'flex shrink-0 items-center gap-2 rounded-full border border-white bg-white px-4 py-2.5 text-[11px] font-bold text-black'
                    : 'flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-[#141414] px-4 py-2.5 text-[11px] font-bold text-zinc-400'
                }
              >
                <IconComponent size={15} />
                {String(label)} ({count})
              </button>
            );
          })}
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

      {serverSheet && (
        <div
          className="fixed inset-0 z-[100] flex items-end bg-black/75 p-3 backdrop-blur-sm"
          onClick={() => setServerSheet(false)}
        >
          <div
            className="glass-card w-full rounded-3xl p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 text-sm font-bold">Pilih server player</div>
            <div className="grid grid-cols-2 gap-2">
              {SERVERS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setServer(item.id);
                    setServerSheet(false);
                  }}
                  className={
                    server === item.id
                      ? 'rounded-2xl border border-white bg-white p-4 text-left text-black'
                      : 'rounded-2xl border border-white/10 bg-[#141414] p-4 text-left'
                  }
                >
                  <div className="text-sm font-black">Server {item.label}</div>
                  <div className={server === item.id ? 'mt-1 text-[10px] text-black/60' : 'mt-1 text-[10px] text-zinc-500'}>
                    {item.note}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
                Embed memakai provider resmi saat channel tidak mempunyai direct HLS yang cocok untuk browser.
              </div>
              <div className="rounded-2xl border border-white/8 p-4">
                Uptime siaran tetap bergantung pada provider upstream, wilayah, CORS, dan perubahan URL.
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="pb-10 text-center text-[9px] uppercase tracking-[.16em] text-zinc-700">
        HIDZTV · 2026 · LIVE SOURCES DEPEND ON UPSTREAM PROVIDERS
      </footer>
    </main>
  );
}
