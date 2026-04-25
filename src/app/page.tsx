import { AppTopBar, BottomNav } from "@/components/AppChrome";
import { CreateMatchForm } from "@/components/CreateMatchForm";
import { RecentMatches } from "@/components/RecentMatches";

export default function HomePage() {
  return (
    <>
      <AppTopBar />
      <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-28 pt-20">
        <section className="mb-6">
          <h2 className="font-display text-3xl font-bold text-[var(--primary)]">Setup New Match</h2>
          <p className="mt-1 text-sm text-slate-600">Configure the field for today&apos;s high-stakes action.</p>
        </section>

        <div className="space-y-6">
          <CreateMatchForm />
          <RecentMatches />
        </div>
      </main>
      <BottomNav active="setup" />
    </>
  );
}
