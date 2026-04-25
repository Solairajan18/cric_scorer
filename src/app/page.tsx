import { CreateMatchForm } from "@/components/CreateMatchForm";
import { RecentMatches } from "@/components/RecentMatches";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-8 md:py-12">
      <section className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-start md:gap-8">
        <div className="space-y-6">
          <span className="inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-soft">
            Free weekend cricket scorer for Vercel
          </span>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
              Score a full friends match from your phone in seconds.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              Create a match, track every ball, switch innings, and share the report. Local storage works instantly, and Firebase can be plugged in later for live multi-device sync on the free tier.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/80 p-4 shadow-soft">Fast scoring pad with undo</div>
            <div className="rounded-3xl bg-white/80 p-4 shadow-soft">Player tracking and innings summary</div>
            <div className="rounded-3xl bg-white/80 p-4 shadow-soft">Shareable live link and final report</div>
          </div>
        </div>

        <div className="pt-1 md:pt-3">
          <CreateMatchForm />
        </div>
      </section>

      <RecentMatches />
    </main>
  );
}
