"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppTopBar, BottomNav } from "@/components/AppChrome";
import { ReportSummary } from "@/components/ReportSummary";
import { useMatch } from "@/hooks/useMatch";

export default function MatchReportPage() {
  const params = useParams<{ matchId: string }>();
  const { match, loading } = useMatch(params.matchId);

  if (loading) {
    return <main className="mx-auto max-w-5xl p-6 text-slate-600">Loading report...</main>;
  }

  if (!match) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-[28px] bg-white p-6 shadow-soft">
          <p className="text-slate-700">Report not available yet.</p>
          <Link href="/" className="mt-4 inline-flex rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white">Go home</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <AppTopBar />
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-20 md:px-6 md:pt-24">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href={`/m/${match.id}`} className="text-sm font-medium text-slate-600 hover:text-slate-900">Back to live match</Link>
        </div>
        <ReportSummary match={match} />
      </main>
      <BottomNav active="scorecard" />
    </>
  );
}
