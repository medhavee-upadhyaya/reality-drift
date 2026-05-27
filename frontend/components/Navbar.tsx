"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [scanInput, setScanInput] = useState("");

  const isLanding = pathname === "/";

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    if (onSearch) {
      onSearch(scanInput.trim());
    } else {
      router.push(`/analyze/${encodeURIComponent(scanInput.trim())}`);
    }
    setScanInput("");
  };

  return (
    <header className="bg-background/80 backdrop-blur-xl flex justify-between items-center px-margin-desktop w-full h-16 border-b border-outline-variant/10 sticky top-0 z-50 flex-shrink-0">
      {/* Left: logo + nav */}
      <div className="flex items-center gap-sm">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 group"
        >
          <span className="text-headline-md font-headline-md font-bold tracking-tighter text-on-surface group-hover:text-primary transition-colors">
            REALITY DRIFT
          </span>
          <span className="font-data-label text-[10px] px-1.5 py-0.5 border border-primary/40 text-primary uppercase tracking-widest">
            V2.04.1
          </span>
        </button>

        <div className="h-4 w-px bg-outline-variant/30 ml-2 hidden md:block" />

        <nav className="hidden md:flex gap-lg ml-lg items-center">
          {[
            { label: "Dashboard", href: "/" },
            { label: "Global Map", href: "#" },
            { label: "Archives", href: "#" },
            { label: "Protocols", href: "#" },
          ].map(({ label, href }) => {
            const active = href === "/" ? isLanding : false;
            return (
              <a
                key={label}
                href={href}
                onClick={href === "/" ? (e) => { e.preventDefault(); router.push("/"); } : undefined}
                className={`text-body-base font-medium pb-1 transition-colors duration-150 ${
                  active
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Right: search + icons */}
      <div className="flex items-center gap-sm">
        {/* Scan input — hidden on landing (has its own search) */}
        {!isLanding && (
          <form onSubmit={handleScan} className="relative hidden lg:block">
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan entity..."
              className="intel-input rounded-lg px-4 py-1.5 text-body-base w-56 pr-9"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary text-[18px] transition-colors">
                search
              </span>
            </button>
          </form>
        )}

        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>

        <ThemeToggle />

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-outline-variant/40 flex items-center justify-center">
          <span className="text-primary font-bold text-xs font-data-label">OP</span>
        </div>
      </div>
    </header>
  );
}
