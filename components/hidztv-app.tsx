"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Disc3, Sparkles, Tv2 } from "lucide-react";
import Topbar from "@/components/navigation/topbar";
import ChannelBrowser from "@/components/channels/channel-browser";
import TvPlayer from "@/components/player/tv-player";
import { CHANNELS, getCategoryCounts } from "@/lib/channels";
import { buildCandidateSources } from "@/lib/stream-engine";
import type { Channel, ChannelCategory } from "@/types/tv";

type Filter="all"|ChannelCategory;
const logoUrl=process.env.NEXT_PUBLIC_HIDZPROJECT_LOGO??"https://www.gobox.my.id/file/vVUoB.png";

export default function HidzTvApp(){
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<Filter>("all");
 const [selectedId,setSelectedId]=useState("rcti");
 const selected=useMemo(()=>CHANNELS.find(c=>c.id===selectedId)??CHANNELS[0]??null,[selectedId]);
 const sources=useMemo(()=>selected?buildCandidateSources(selected.sources,typeof window==="undefined"?undefined:window.location.origin):[],[selected]);
 const playable=CHANNELS.filter(c=>c.sources.length>0).length;
 const counts=getCategoryCounts();
 const selectChannel=(channel:Channel)=>{setSelectedId(channel.id);window.scrollTo({top:0,behavior:"smooth"})};

 return <div className="min-h-screen bg-[var(--hz-bg)] text-[var(--hz-text)]">
  <Topbar query={query} onQueryChange={setQuery}/>
  <main className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
   <section className="hz-grid mb-5 overflow-hidden rounded-3xl border-2 border-[var(--hz-border)] p-4 sm:p-6">
    <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
     <div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-[var(--hz-accent-2)]"><Sparkles size={13}/>Rebuilt for HidzProject</div>
      <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[.95] tracking-[-.04em] sm:text-6xl">Live TV, without the clutter.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--hz-muted)] sm:text-base">HidzTv dibuat ulang dari nol dengan fokus pada live playback, browsing channel yang cepat, dan tampilan Y2K neobrutalist yang tetap nyaman dipakai di HP.</p>
      <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[.1em]"><span className="hz-card-soft rounded-full px-3 py-2">{counts.all} channels</span><span className="hz-card-soft rounded-full px-3 py-2">{playable} configured</span><span className="hz-card-soft rounded-full px-3 py-2">Dark + Light</span></div>
     </div>
     <div className="flex items-center gap-3 lg:justify-end">
      <div className="grid size-16 place-items-center rounded-2xl border-2 border-[var(--hz-border)] bg-[var(--hz-accent)] p-2 shadow-[4px_4px_0_var(--hz-border)]"><Image src={logoUrl} alt="HIDZPROJECT" width={56} height={56} className="size-full rounded-xl object-cover" unoptimized/></div>
      <div><div className="text-xs font-black uppercase tracking-[.2em]">HIDZPROJECT</div><div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[var(--hz-muted)]"><Disc3 size={12}/>HidzTv 3.0</div></div>
     </div>
    </div>
   </section>

   <section className="space-y-3" aria-labelledby="player-heading">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[var(--hz-accent-2)]">Now playing</p><h2 id="player-heading" className="mt-1 text-xl font-black">{selected?.name??"HidzTv"}</h2></div><div className="hidden items-center gap-1 text-[10px] font-black uppercase tracking-[.15em] text-[var(--hz-muted)] sm:flex"><Tv2 size={14}/>{counts.all} catalogue</div></div>
    <TvPlayer channel={selected} sources={sources}/>
   </section>

   <section className="mt-8"><ChannelBrowser channels={CHANNELS} filter={filter} query={query} selectedId={selected?.id??""} onFilterChange={setFilter} onSelect={selectChannel}/></section>
   <footer className="mt-10 flex flex-col gap-2 border-t-2 border-[var(--hz-border)] pt-4 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--hz-muted)] sm:flex-row sm:items-center sm:justify-between"><span>HIDZPROJECT · HidzTv</span><span>Next.js · Vercel · HLS</span></footer>
  </main>
 </div>
}
