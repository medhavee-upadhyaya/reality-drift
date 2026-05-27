"use client";

import { useEffect, useState } from "react";

export default function StatusBar() {
  const [time, setTime] = useState("--:--:-- UTC");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toISOString().split("T")[1].split(".")[0] + " UTC");
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 w-full h-8 bg-surface-container-lowest/95 backdrop-blur-sm flex justify-between items-center px-margin-desktop z-50 border-t border-outline-variant/10 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-drift" />
          <span className="font-data-label text-[10px] text-on-surface-variant uppercase tracking-widest">
            Network: Secure
          </span>
        </div>
        <span className="font-data-label text-[10px] text-on-surface-variant/40 uppercase hidden sm:block">
          ENC: AES-256-GCM
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-md font-data-label text-[10px] text-on-surface-variant uppercase">
        <span className="hidden md:block">Lat: 37.7749 N</span>
        <span className="hidden md:block">Lon: 122.4194 W</span>
        <span className="text-primary tabular-nums">{time}</span>
      </div>
    </footer>
  );
}
