"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Link from "next/link";

type NavKey = "setup" | "live" | "scorecard";

export function AppTopBar() {

  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

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
      
      <div className="relative">
        {user ? (
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-10 w-10 overflow-hidden rounded-full border-2 border-white/20 transition hover:border-white/40"
          >
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || "User"}`} 
              alt="Profile" 
              className="h-full w-full object-cover"
            />
          </button>
        ) : (
          <Link href="/login" className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/20">
            Login
          </Link>
        )}

        {showMenu && user && (
          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-bold text-slate-900">{user.displayName}</p>
              <p className="truncate text-[10px] text-slate-500">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-slate-100" />
            <button
              onClick={() => {
                setShowMenu(false);
                void logout();
              }}
              className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        )}
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
