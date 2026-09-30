"use client";
import type { ChannelCategory } from "@/types/tv";
import { CATEGORY_LABELS } from "@/lib/channels";
type Filter="all"|ChannelCategory;
type Props={value:Filter;counts:Record<Filter,number>;onChange:(value:Filter)=>void};
export default function CategoryTabs({value,counts,onChange}:Props){
 const filters=Object.keys(CATEGORY_LABELS) as Filter[];
 return <div className="hz-scroll flex gap-2 overflow-x-auto pb-2" aria-label="Kategori channel">{filters.map(filter=><button key={filter} type="button" data-active={value===filter} className="hz-button shrink-0 rounded-full bg-[var(--hz-surface)] px-4 py-2.5 text-xs font-black uppercase tracking-[.08em]" onClick={()=>onChange(filter)}>{CATEGORY_LABELS[filter]}<span className="ml-2 opacity-55">{counts[filter]}</span></button>)}</div>
}
