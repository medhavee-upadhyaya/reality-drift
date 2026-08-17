"use client";

import { useEffect, useState } from "react";
import AppPage from "@/components/AppPage";
import { DEFAULT_WORKSPACE, WORKSPACE_KEY, WorkspacePreferences, getWorkspacePreferences } from "@/lib/workspace";

export default function SettingsPage(){
  const [prefs,setPrefs]=useState<WorkspacePreferences>(DEFAULT_WORKSPACE); const [saved,setSaved]=useState(false);
  useEffect(()=>setPrefs(getWorkspacePreferences()),[]);
  const save=()=>{localStorage.setItem(WORKSPACE_KEY,JSON.stringify(prefs));window.dispatchEvent(new Event("rd-workspace-change"));setSaved(true);setTimeout(()=>setSaved(false),2000)};
  return <AppPage><div className="mb-8"><p className="font-data-label text-primary uppercase text-[11px] tracking-widest mb-2">Workspace</p><h1 className="text-5xl font-bold">Settings</h1><p className="text-on-surface-variant mt-3">Set browser-level defaults for your Reality Drift workspace.</p></div><section className="glass-panel rounded-2xl p-6 max-w-2xl space-y-6"><Setting label="Compact dashboard density" detail="Reduce spacing in dense intelligence views." checked={prefs.compactMode} onChange={value=>setPrefs({...prefs,compactMode:value})}/><Setting label="Show demo-data labels" detail="Keep presentation provenance visible on bundled intelligence files." checked={prefs.showDemoLabels} onChange={value=>setPrefs({...prefs,showDemoLabels:value})}/><label className="block"><span className="text-sm font-semibold">Default workspace mode</span><p className="text-xs text-on-surface-variant mb-2">Choose the first workflow shown when opening the product.</p><select value={prefs.defaultMode} onChange={e=>setPrefs({...prefs,defaultMode:e.target.value as WorkspacePreferences["defaultMode"]})} className="intel-input rounded-lg px-3 py-2 w-full"><option value="outsider">Outsider intelligence</option><option value="compliance">Internal compliance</option></select></label><button onClick={save} className="bg-primary text-on-primary rounded-xl px-6 py-3 font-data-label text-[11px] uppercase">{saved?"Settings saved ✓":"Save workspace settings"}</button></section></AppPage>
}

function Setting({label,detail,checked,onChange}:{label:string;detail:string;checked:boolean;onChange:(value:boolean)=>void}){return <div className="flex items-center justify-between gap-6"><div><h2 className="text-sm font-semibold">{label}</h2><p className="text-xs text-on-surface-variant mt-1">{detail}</p></div><button onClick={()=>onChange(!checked)} className={`w-12 h-7 rounded-full p-1 transition-colors ${checked?"bg-primary":"bg-surface-container-highest"}`}><span className={`block w-5 h-5 rounded-full bg-white transition-transform ${checked?"translate-x-5":""}`}/></button></div>}
