'use client';

import Hls from 'hls.js';
import { ChevronRight, CircleUserRound, Globe2, House, Maximize2, MonitorPlay, Pause, Play, Search, Settings2, Signal, Tv, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Channel } from '@/lib/channels';
import { CHANNELS, INTERNATIONAL_COUNT, NATIONAL_COUNT } from '@/lib/channels';

type ServerId = 'lite' | 'fast' | 'max' | 'embed';
type Filter = 'all' | 'national' | 'international';
type Profile = { id: ServerId; label: string; note: string; sourceIndex: number; maxBuffer: number; backBuffer: number; liveSyncDurationCount: number };

const SERVERS: Profile[] = [
  { id: 'lite', label: 'Lite', note: 'Hemat data', sourceIndex: 0, maxBuffer: 9, backBuffer: 12, liveSyncDurationCount: 2 },
  { id: 'fast', label: 'Fast', note: 'Cepat mulai', sourceIndex: 0, maxBuffer: 14, backBuffer: 18, liveSyncDurationCount: 2 },
  { id: 'max', label: 'Max', note: 'Buffer tebal', sourceIndex: 1, maxBuffer: 28, backBuffer: 45, liveSyncDurationCount: 3 },
  { id: 'embed', label: 'Embed', note: 'Provider page', sourceIndex: 0, maxBuffer: 14, backBuffer: 18, liveSyncDurationCount: 3 },
];

const profileOf = (id: ServerId) => SERVERS.find((item) => item.id === id) ?? SERVERS[1];

function ChannelThumb({ channel }: { channel: Channel }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: channel.color }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="relative z-10 px-2 text-center text-white"><div className="text-[8px] font-black tracking-[.25em] opacity-60">HIDZTV</div><div className="mt-1 text-[15px] font-black leading-none">{channel.name}</div></div>
    </div>
  );
}

export default function HidzTV() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(CHANNELS.find((item) => item.id === 'gtv')?.id ?? CHANNELS[0].id);
  const [server, setServer] = useState<ServerId>('fast');
  const [serverSheet, setServerSheet] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'fallback' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [sourceNumber, setSourceNumber] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [details, setDetails] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceRef = useRef(0);
  const startedRef = useRef(false);
  const mediaRetryRef = useRef(0);
  const currentSelected = useMemo(() => CHANNELS.find((item) => item.id === selectedId) ?? CHANNELS[0], [selectedId]);

  const visibleChannels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHANNELS.filter((item) => {
      const category = filter === 'all' || item.category === filter;
      const search = !q || `${item.name} ${item.region} ${item.language ?? ''}`.toLowerCase().includes(q);
      return category && search;
    });
  }, [filter, query]);

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  const destroyHls = () => { hlsRef.current?.destroy(); hlsRef.current = null; };
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

  const orderedSources = (profile: Profile) => {
    const sources = currentSelected.sources;
    if (!sources.length) return [];
    const primary = Math.min(profile.sourceIndex, sources.length - 1);
    return [sources[primary], ...sources.filter((_, index) => index !== primary)];
  };

  const loadHlsSource = (source: string, profile: Profile) => {
    const video = videoRef.current;
    if (!video) return;
    startedRef.current = false;
    setStatus(sourceRef.current ? 'fallback' : 'connecting');
    setMessage(sourceRef.current ? `Beralih ke sumber ${sourceRef.current + 1}…` : 'Menghubungkan ke stream…');
    clearTimer();

    const fail = () => {
      if (startedRef.current) return;
      const next = sourceRef.current + 1;
      const sources = orderedSources(profile);
      if (next < sources.length) {
        sourceRef.current = next;
        setSourceNumber(next + 1);
        destroyHls();
        resetVideo();
        loadHlsSource(sources[next], profile);
        return;
      }
      setStatus('error');
      setMessage('Semua sumber yang tersedia gagal dimuat.');
    };
    timerRef.current = setTimeout(fail, 11000);

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
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(source));
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimer();
        startedRef.current = true;
        mediaRetryRef.current = 0;
        setStatus('live');
        setMessage('');
        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => { const level = hls.levels[data.level]; if (level?.height) setQuality(`${level.height}p`); });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal || hlsRef.current !== hls) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetryRef.current < 1) { mediaRetryRef.current += 1; hls.recoverMediaError(); return; }
        fail();
      });
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      const ready = () => { clearTimer(); startedRef.current = true; setStatus('live'); setMessage(''); video.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); };
      video.onloadedmetadata = ready;
      video.oncanplay = ready;
      video.onerror = fail;
      video.src = source;
      video.load();
      return;
    }
    fail();
  };

  const loadStream = () => {
    clearTimer();
    destroyHls();
    resetVideo();
    sourceRef.current = 0;
    setSourceNumber(1);
    setQuality('Auto');
    setPlaying(false);
    if (server === 'embed' && currentSelected.embedUrl) { setStatus('live'); setMessage('Embed aktif'); return; }
    const profile = profileOf(server);
    const sources = orderedSources(profile);
    if (!sources.length) { setStatus('error'); setMessage('Channel belum memiliki stream.'); return; }
    loadHlsSource(sources[0], profile);
  };

  useEffect(() => { loadStream(); return () => { clearTimer(); destroyHls(); resetVideo(); }; }, [selectedId, server]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try { if (video.paused) { await video.play(); setPlaying(true); } else { video.pause(); setPlaying(false); } } catch { setMessage('Browser menahan autoplay. Tekan play lagi.'); }
  };
  const toggleMute = () => { const video = videoRef.current; if (!video) return; video.muted = !video.muted; setMuted(video.muted); };
  const toggleFullscreen = async () => {
    if (!playerRef.current) return;
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await playerRef.current.requestFullscreen(); } catch { setMessage('Fullscreen tidak tersedia di browser ini.'); }
  };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#090909]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setFilter('all')} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-[#151515] text-white"><House size={18} /></button>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[19px] font-black">HIDZTV</span><span className="rounded-md bg-white/8 px-2 py-1 text-[9px] font-bold tracking-[.16em] text-zinc-500">LIVE</span></div><p className="truncate text-[11px] text-zinc-500">National & International · 24/7</p></div>
          <div className="hidden items-center gap-2 sm:flex"><span className="live-dot h-2.5 w-2.5 rounded-full bg-lime-300" /><span className="text-[9px] font-bold tracking-[.16em] text-zinc-500">HLS ACTIVE</span></div>
          <button onClick={() => setDetails(true)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-[#151515] text-zinc-300"><CircleUserRound size={18} /></button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pt-6">
        <div ref={playerRef} className="player-shell relative">
          <div className="aspect-video bg-black">
            {server === 'embed' && currentSelected.embedUrl ? <iframe src={currentSelected.embedUrl} title={currentSelected.name} className="h-full w-full border-0" allow="autoplay; fullscreen; picture-in-picture" /> : <video ref={videoRef} playsInline preload="metadata" className="h-full w-full object-contain" />}
          </div>
          <div className="absolute inset-x-0 top-0 flex justify-between bg-gradient-to-b from-black/75 to-transparent p-3 sm:p-4">
            <div><div className="flex items-center gap-2"><span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-black">LIVE</span><span className="truncate text-[11px] font-semibold">{currentSelected.name}</span></div><div className="mt-1 text-[9px] text-white/55">CH {currentSelected.number} · {currentSelected.category === 'national' ? 'Nasional' : currentSelected.region}</div></div>
            <div className="flex gap-2 text-[9px] text-white/55"><span className="rounded-full bg-black/40 px-2 py-1">{quality}</span><span className="rounded-full bg-black/40 px-2 py-1">SRC {sourceNumber}</span></div>
          </div>
          {message && <div className="pointer-events-none absolute inset-0 grid place-items-center p-5"><div className="rounded-2xl border border-white/10 bg-black/70 px-5 py-4 text-center backdrop-blur-md"><div className="text-[12px] font-semibold">{message}</div></div></div>}
          {status === 'error' && <div className="absolute inset-0 grid place-items-center bg-black/70 p-5"><div className="max-w-sm rounded-2xl border border-red-500/20 bg-[#121212] p-6 text-center"><Signal className="mx-auto text-red-400" size={24} /><div className="mt-3 text-sm font-bold">Stream tidak tersedia</div><p className="mt-2 text-xs leading-relaxed text-zinc-500">Sumber eksternal bisa berubah atau offline. Coba server lain.</p><button onClick={loadStream} className="mt-4 rounded-xl bg-white px-4 py-2 text-[11px] font-black uppercase text-black">Coba lagi</button></div></div>}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-9 sm:px-4 sm:pb-4">
            <div className="flex items-center gap-2"><button onClick={togglePlay} className="grid h-10 w-10 place-items-center rounded-full bg-white text-black">{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button><button onClick={toggleMute} className="hidden h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md sm:grid">{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button></div>
            <div className="flex items-center gap-2"><div className="hidden items-center gap-1 rounded-full bg-white/8 p-1 md:flex">{SERVERS.map((item) => <button key={item.id} onClick={() => setServer(item.id)} className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${server === item.id ? 'bg-white text-black' : 'text-white/60'}`}>{item.label}</button>)}</div><button onClick={() => setServerSheet(true)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white md:hidden"><Settings2 size={16} /></button><button onClick={toggleFullscreen} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><Maximize2 size={16} /></button></div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[9px] uppercase tracking-[.14em] text-zinc-500"><span className="rounded-full border border-white/8 bg-[#101010] px-3 py-1.5">Server {profileOf(server).label}</span><span className="rounded-full border border-white/8 bg-[#101010] px-3 py-1.5">{profileOf(server).note}</span><span className="rounded-full border border-white/8 bg-[#101010] px-3 py-1.5">Source {sourceNumber}/{currentSelected.sources.length || 1}</span></div>

        <div className="mt-5"><h1 className="text-[22px] font-black">{currentSelected.name}</h1><p className="mt-1 text-[11px] text-zinc-500">CH {currentSelected.number} · {currentSelected.category === 'national' ? 'Nasional' : currentSelected.region}</p></div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 hidz-scrollbar">{SERVERS.map((item) => <button key={item.id} onClick={() => setServer(item.id)} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[.13em] ${server === item.id ? 'border-white bg-white text-black' : 'border-white/10 bg-[#131313] text-zinc-400'}`}>Server {item.label}</button>)}</div>

        <div className="mt-5 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari saluran (contoh: GTV, SCTV, CNN)…" className="h-12 w-full rounded-2xl border border-white/10 bg-[#141414] pl-11 pr-4 text-[12px] outline-none placeholder:text-zinc-600 focus:border-white/20" /></div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 hidz-scrollbar">
          {([['all', `Semua (${CHANNELS.length})`, Tv], ['national', `Nasional (${NATIONAL_COUNT})`, MonitorPlay], ['international', `Internasional (${INTERNATIONAL_COUNT})`, Globe2]] as const).map(([id, label, Icon]) => <button key={id} onClick={() => setFilter(id)} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[11px] font-bold ${filter === id ? 'border-white bg-white text-black' : 'border-white/10 bg-[#141414] text-zinc-400'}`}><Icon size={15} />{label}</button>)}
        </div>

        <div className="mt-6 flex items-end justify-between"><div><h2 className="text-[18px] font-black">Daftar Saluran ({visibleChannels.length})</h2><p className="mt-1 text-[10px] text-zinc-500">Kategori: {filter === 'all' ? 'Semua' : filter === 'national' ? 'Nasional' : 'Internasional'}</p></div></div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleChannels.map((channel) => <button key={channel.id} onClick={() => setSelectedId(channel.id)} className={`channel-card flex min-h-[82px] items-center gap-3 p-3 text-left ${selectedId === channel.id ? 'ring-1 ring-white/15' : ''}`}><div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">{channel.logo ? <img src={channel.logo} alt="" className="h-full w-full object-contain" /> : <ChannelThumb channel={channel} />}</div><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-black">{channel.name}</div><div className="mt-1 text-[10px] text-zinc-500">CH {channel.number} · {channel.category === 'national' ? 'Nasional' : channel.region}</div></div><ChevronRight size={17} className="text-zinc-700" /></button>)}
        </div>
      </section>

      {serverSheet && <div className="fixed inset-0 z-[100] flex items-end bg-black/75 p-3 backdrop-blur-sm" onClick={() => setServerSheet(false)}><div className="glass-card w-full rounded-3xl p-4" onClick={(event) => event.stopPropagation()}><div className="mb-3 text-sm font-bold">Pilih server player</div><div className="grid grid-cols-2 gap-2">{SERVERS.map((item) => <button key={item.id} onClick={() => { setServer(item.id); setServerSheet(false); }} className={`rounded-2xl border p-4 text-left ${server === item.id ? 'border-white bg-white text-black' : 'border-white/10 bg-[#141414]'}`}><div className="text-sm font-black">Server {item.label}</div><div className={`mt-1 text-[10px] ${server === item.id ? 'text-black/60' : 'text-zinc-500'}`}>{item.note}</div></button>)}</div></div></div>}
      {details && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setDetails(false)}><div className="glass-card w-full max-w-md rounded-3xl p-6" onClick={(event) => event.stopPropagation()}><div className="text-lg font-black">HIDZTV</div><p className="mt-1 text-xs text-zinc-500">Next.js · HLS.js · Vercel</p><div className="mt-5 space-y-3 text-xs text-zinc-400"><div className="rounded-2xl border border-white/8 p-4">Source failover otomatis sebelum playback dimulai.</div><div className="rounded-2xl border border-white/8 p-4">Profile Lite/Fast/Max mengatur strategi buffer dan latency.</div><div className="rounded-2xl border border-white/8 p-4">Embed hanya digunakan saat channel memiliki URL provider.</div></div></div></div>}

      <footer className="pb-10 text-center text-[9px] uppercase tracking-[.16em] text-zinc-700">HIDZTV · 2026 · STREAM QUALITY DEPENDS ON UPSTREAM SOURCE</footer>
    </main>
  );
}
