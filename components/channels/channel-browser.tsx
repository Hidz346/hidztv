"use client";
import { useMemo } from "react";
import type { Channel, ChannelCategory } from "@/types/tv";
import { CATEGORY_LABELS, getCategoryCounts } from "@/lib/channels";
import CategoryTabs from "@/components/navigation/category-tabs";
import ChannelCard from "@/components/channels/channel-card";
type Filter="all"|ChannelCategory;
type Props={channels:readonly Channel[];filter:Filter;query:string;selectedId:string;onFilterChange:(filter:Filter)=>void;onSelect:(channel:Channel)=>void};
export default function ChannelBrowser({channels,filter,query,selectedId,onFilterChange,onSelect}:Props){
 const counts=getCategoryCounts();
 const visible=useMemo(()=>{const n=query.trim().toLowerCase();return channels.filter(c=>(filter==="all"||c.category===filter)&&(!n||[c.name,c.shortName,c.region,c.language].join(" ").toLowerCase().includes(n)))},[channels,filter,query]);
 return <section aria-labelledby="channel-heading" className="space-y-4">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.24em] text-[var(--hz-accent-2)]">Channel browser</p><h2 id="channel-heading" className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{CATEGORY_LABELS[filter]}</h2></div><p className="text-xs font-bold text-[var(--hz-muted)]">{visible.length} channel terlihat</p></div>
  <CategoryTabs value={filter} counts={counts} onChange={onFilterChange}/>
  {visible.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{visible.map(c=><ChannelCard key={c.id} channel={c} selected={c.id===selectedId} onSelect={onSelect}/>)}</div>:<div className="hz-card rounded-2xl p-8 text-center"><div className="text-sm font-black">Channel tidak ditemukan</div><p className="mt-1 text-xs text-[var(--hz-muted)]">Coba kata kunci lain atau ganti kategori.</p></div>}
 </section>
}
