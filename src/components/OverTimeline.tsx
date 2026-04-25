import { Match } from "@/types/match";

export function OverTimeline({ match }: { match: Match }) {
  const recent = match.events.slice(-18).reverse();

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Recent balls</p>
          <p className="text-sm text-slate-500">Latest scoring sequence for quick checking.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {recent.length ? recent.map((event) => (
          <div key={event.id} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800">
            {event.label}
          </div>
        )) : <p className="text-sm text-slate-500">No balls recorded yet.</p>}
      </div>
    </section>
  );
}
