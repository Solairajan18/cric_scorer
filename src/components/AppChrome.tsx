import Link from "next/link";

type NavKey = "setup" | "live" | "scorecard" | "summary";

export function AppTopBar() {
  return (
    <header className="app-topbar fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="font-display text-2xl">|)</span>
        <h1 className="font-display text-xl font-black uppercase tracking-[0.22em] text-white">Solai&apos;s Cric Scorer</h1>
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

export function BottomNav({ active }: { active: NavKey }) {
  return (
    <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 flex h-20 items-center justify-around px-2 text-white">
      <Link href="/" className={navItemClasses(active === "setup")}>
        <span className="mb-1 text-lg">O</span>
        <span>Setup</span>
      </Link>
      <Link href="#" className={navItemClasses(active === "live")}>
        <span className="mb-1 text-lg">L</span>
        <span>Live</span>
      </Link>
      <Link href="#" className={navItemClasses(active === "scorecard")}>
        <span className="mb-1 text-lg">S</span>
        <span>Scorecard</span>
      </Link>
      <Link href="#" className={navItemClasses(active === "summary")}>
        <span className="mb-1 text-lg">R</span>
        <span>Summary</span>
      </Link>
    </nav>
  );
}
