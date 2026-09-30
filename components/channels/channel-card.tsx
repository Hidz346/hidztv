"use client";
import { Radio } from "lucide-react";
import type { Channel } from "@/types/tv";
type Props={channel:Channel;selected:boolean;onSelect:(channel:Channel)=>void};
export default function ChannelCard({channel,selected,onSelect}:Props){
 const available=channel.sources.length>0;
 return <button type="button" onClick={()=>onSelect(channel)} className="hz-card flex min-h-28 w-full flex-col justify-between rounded-2xl p-3 text-left transition-transform duration-150 hover:-translate-y-0.5" data-active={selected} aria-pressed={selected}>
  <div className="flex items-start justify-between gap-3"><div className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-[var(--hz-border)] bg-[var(--hz-surface-2)] text-sm font-black">{channel.shortName.slice(0,4)}</div><span className="rounded-full border-2 border-[var(--hz-border)] px-2 py-1 text-[9px] font-black">CH {String(channel.number).padStart(2,"0")}</span></div>
  <div className="mt-3 min-w-0"><div className="truncate text-sm font-black">{channel.name}</div><div className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.08em] text-[var(--hz-muted)]"><Radio size={11}/>{available?"Source tersedia":"Source belum dikonfigurasi"}</div></div>
 </button>
}
