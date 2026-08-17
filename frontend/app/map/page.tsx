"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppPage from "@/components/AppPage";
import DriftGlobe from "@/components/globe/DriftGlobe";
import { DEMO_COMPANIES } from "@/lib/preloaded";

const REGION_NAMES: Record<string, string> = {
  US: "United States", DE: "European Union", IN: "India", BR: "Brazil", SG: "Singapore",
};

export default function GlobalMapPage() {
  const router = useRouter();
  const [company, setCompany] = useState(DEMO_COMPANIES[0]);
  const [regions, setRegions] = useState(["US", "DE", "IN", "BR", "SG"]);

  const toggleRegion = (region: string) => {
    setRegions((current) =>
      current.includes(region) ? current.filter((item) => item !== region) : [...current, region]
    );
  };

  return (
    <AppPage>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-data-label text-primary uppercase tracking-widest text-[11px] mb-2">Geographic Intelligence</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Global narrative map</h1>
          <p className="text-on-surface-variant mt-3 max-w-2xl">Explore which monitored markets contribute to each company&apos;s narrative drift. Toggle regions to isolate the comparison surface.</p>
        </div>
        <button onClick={() => router.push(`/analyze/${company.slug}`)} className="bg-primary text-on-primary px-5 py-3 rounded-xl font-data-label uppercase text-[11px] tracking-widest">Open intelligence file</button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 glass-panel rounded-2xl p-6 min-h-[520px] flex flex-col items-center justify-center">
          <DriftGlobe activeRegions={regions} rdiScore={company.rdi} />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full mt-6">
            {Object.entries(REGION_NAMES).map(([code, name]) => (
              <button key={code} onClick={() => toggleRegion(code)} className={`rounded-xl border px-3 py-3 text-left transition-all ${regions.includes(code) ? "border-primary/50 bg-primary/10" : "border-outline-variant/20 opacity-45"}`}>
                <span className="block font-data-value text-lg">{code}</span>
                <span className="font-data-label text-[9px] uppercase text-on-surface-variant">{name}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-5 space-y-4">
          {DEMO_COMPANIES.map((item) => (
            <button key={item.slug} onClick={() => setCompany(item)} className={`w-full glass-panel rounded-xl p-5 text-left border transition-all ${company.slug === item.slug ? "border-primary/50" : "border-transparent hover:border-outline-variant/30"}`}>
              <div className="flex items-start justify-between">
                <div><h2 className="text-2xl font-bold">{item.name}</h2><p className="font-data-label text-[10px] uppercase mt-1" style={{color:item.color}}>{item.driftType}</p></div>
                <span className="font-data-value text-4xl" style={{color:item.color}}>{item.rdi}</span>
              </div>
              <p className="text-sm text-on-surface-variant mt-4">{item.hook}</p>
              <div className="h-1 bg-surface-container-highest rounded mt-4 overflow-hidden"><div className="h-full" style={{width:`${item.rdi}%`,background:item.color}} /></div>
            </button>
          ))}
          <div className="glass-panel rounded-xl p-4 text-xs text-on-surface-variant">
            <strong className="text-on-surface">{regions.length} markets active.</strong> Region filters update the globe and define the geographic comparison scope.
          </div>
        </aside>
      </div>
    </AppPage>
  );
}
