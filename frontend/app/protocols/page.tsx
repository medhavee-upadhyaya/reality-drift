"use client";

import { useState } from "react";
import AppPage from "@/components/AppPage";

const PROTOCOLS = [
  {name:"Regional Narrative Comparison",stage:"01",detail:"Collect and normalize public claims from US, EU, India, Brazil, and Singapore before pairwise semantic comparison."},
  {name:"Regulatory Evidence Match",stage:"02",detail:"Compare current public claims with SEC language and current regulatory or news evidence."},
  {name:"Independent Verification",stage:"03",detail:"Challenge each proposed contradiction and return verified, disputed, or insufficient-evidence status."},
  {name:"GraphRAG Memory",stage:"04",detail:"Retrieve relevant historical graph context while requiring current evidence for every new finding."},
  {name:"Deterministic RDI",stage:"05",detail:"Apply fixed, inspectable weights after model outputs have been normalized and validated."},
];

export default function ProtocolsPage() {
  const [open, setOpen] = useState(0);
  const [weights, setWeights] = useState({geographic:30,evidence:35,temporal:20,disclosure:15});
  const total = Object.values(weights).reduce((sum,value)=>sum+value,0);
  return <AppPage>
    <div className="mb-8"><p className="font-data-label text-primary uppercase text-[11px] tracking-widest mb-2">Methodology Control Plane</p><h1 className="text-5xl font-bold">Analysis protocols</h1><p className="text-on-surface-variant mt-3 max-w-3xl">Inspect the safeguards and experiment with RDI weights. Changes below are a local simulation and never rewrite the production methodology.</p></div>
    <div className="grid lg:grid-cols-12 gap-6">
      <section className="lg:col-span-7 space-y-3">{PROTOCOLS.map((item,index)=><button key={item.stage} onClick={()=>setOpen(index)} className={`w-full glass-panel rounded-xl p-5 text-left transition-all ${open===index?"border-primary/50":""}`}><div className="flex gap-4"><span className="font-data-value text-primary">{item.stage}</span><div><h2 className="text-lg font-bold">{item.name}</h2>{open===index&&<p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{item.detail}</p>}</div></div></button>)}</section>
      <aside className="lg:col-span-5 glass-panel rounded-2xl p-6 h-fit"><h2 className="font-data-label uppercase tracking-widest text-primary mb-5">RDI weight simulator</h2>{Object.entries(weights).map(([key,value])=><label key={key} className="block mb-5"><span className="flex justify-between text-sm capitalize mb-2"><span>{key}</span><strong className="font-data-value">{value}%</strong></span><input type="range" min="0" max="60" value={value} onChange={(e)=>setWeights({...weights,[key]:Number(e.target.value)})} className="w-full accent-primary"/></label>)}<div className={`rounded-xl p-4 mt-3 ${total===100?"bg-green-500/10 text-green-400":"bg-tertiary/10 text-tertiary"}`}><span className="font-data-label text-[10px] uppercase">Total allocation</span><strong className="font-data-value text-3xl block">{total}%</strong><p className="text-xs mt-1">{total===100?"Valid simulation":"Weights must total 100%"}</p></div><button onClick={()=>setWeights({geographic:30,evidence:35,temporal:20,disclosure:15})} className="w-full glass-panel rounded-xl py-2 mt-4 font-data-label text-[10px] uppercase">Reset production weights</button></aside>
    </div>
  </AppPage>;
}
