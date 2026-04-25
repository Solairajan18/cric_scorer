"use client";

import Link from "next/link";

type NavKey = "setup" | "live" | "scorecard";

export function AppTopBar() {
  return (
    <header className="app-topbar fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner">
          <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7 drop-shadow-sm">
            <path d="M18.5,2L5.5,15L4,19.5L8.5,18L21.5,5L18.5,2M7.4,15.6L16.6,6.4L17.6,7.4L8.4,16.6L7.4,15.6Z" />
            <circle cx="17" cy="17" r="2.5" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-black uppercase tracking-[0.18em] text-white">Solai&apos;s Cric Scorer</h1>
      </div>
      <div className="rounded-full p-2 text-white/90 transition hover:bg-emerald-800">
        <span className="text-lg">+</span>
      </div>
    </header>
  );
}

function navItemClasses(active: boolean) {
  return `flex flex-col items-center justify-center rounded-md px-4 py-1 text-[10px] font-black uppercase tracking-tight transition ${active ? "app-bottom-nav-active text-white" : "text-emerald-200/60 hover:text-white"}`;
}

export function BottomNav({ active, onTabChange }: { active: NavKey; onTabChange?: (key: NavKey) => void }) {
  const handleTab = (key: NavKey, e: React.MouseEvent) => {
    if (onTabChange) {
      e.preventDefault();
      onTabChange(key);
    }
  };

  return (
    <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 flex h-20 items-center justify-around px-2 text-white">
      <Link href="/" className={navItemClasses(active === "setup")}>
        <span className="mb-1 text-lg">O</span>
        <span>Setup</span>
      </Link>
      <Link href="#" onClick={(e) => handleTab("live", e)} className={navItemClasses(active === "live")}>
        <span className="mb-1 text-lg">L</span>
        <span>Live</span>
      </Link>
      <button onClick={(e) => handleTab("scorecard", e)} className={navItemClasses(active === "scorecard")}>
        <span className="mb-1 text-lg">S</span>
        <span>Scorecard</span>
      </button>
    </nav>
  );
}
