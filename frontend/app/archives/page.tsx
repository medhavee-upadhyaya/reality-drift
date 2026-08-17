"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppPage from "@/components/AppPage";
import { DEMO_COMPANIES } from "@/lib/preloaded";
import { ArchiveEntry, clearArchive, getArchive } from "@/lib/workspace";

export default function ArchivesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "risk">("recent");

  useEffect(() => {
    const saved = getArchive();
    const demos: ArchiveEntry[] = DEMO_COMPANIES.map((item) => ({company:item.name,slug:item.slug,rdi:item.rdi,driftType:item.driftType,analyzedAt:"2026-05-29T12:00:00Z",source:"demo"}));
    setEntries(saved.length ? saved : demos);
  }, []);

  const visible = useMemo(() => entries.filter((item) => `${item.company} ${item.driftType}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "risk" ? b.rdi-a.rdi : +new Date(b.analyzedAt)-+new Date(a.analyzedAt)), [entries, query, sort]);

  return <AppPage>
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div><p className="font-data-label text-primary uppercase text-[11px] tracking-widest mb-2">Institutional Memory</p><h1 className="text-5xl font-bold">Analysis archives</h1><p className="text-on-surface-variant mt-3">Every opened intelligence file is retained locally for fast return and comparison.</p></div>
      <button onClick={() => { clearArchive(); setEntries([]); }} className="glass-panel px-4 py-2 rounded-lg font-data-label text-[10px] uppercase text-tertiary">Clear local history</button>
    </div>
    <div className="glass-panel rounded-xl p-3 flex flex-col sm:flex-row gap-3 mb-5"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search company or drift type…" className="intel-input rounded-lg px-4 py-3 flex-1"/><select value={sort} onChange={(e)=>setSort(e.target.value as "recent"|"risk")} className="intel-input rounded-lg px-4"><option value="recent">Most recent</option><option value="risk">Highest RDI</option></select></div>
    <div className="space-y-3">{visible.map((item,index)=><button key={`${item.slug}-${item.analyzedAt}-${index}`} onClick={()=>router.push(`/analyze/${item.slug}`)} className="w-full glass-panel rounded-xl p-5 grid grid-cols-2 md:grid-cols-5 gap-4 text-left hover:border-primary/30 transition-all"><div><span className="font-data-label text-[9px] uppercase text-outline">Company</span><strong className="block text-xl">{item.company}</strong></div><div><span className="font-data-label text-[9px] uppercase text-outline">RDI</span><strong className="block text-xl text-tertiary">{item.rdi}</strong></div><div className="col-span-2 md:col-span-1"><span className="font-data-label text-[9px] uppercase text-outline">Pattern</span><span className="block text-sm">{item.driftType}</span></div><div><span className="font-data-label text-[9px] uppercase text-outline">Source</span><span className="block text-sm uppercase">{item.source}</span></div><div><span className="font-data-label text-[9px] uppercase text-outline">Analyzed</span><span className="block text-sm">{new Date(item.analyzedAt).toLocaleDateString()}</span></div></button>)}</div>
    {!visible.length && <div className="glass-panel rounded-xl p-12 text-center text-on-surface-variant">No archived analyses match this view.</div>}
  </AppPage>;
}
