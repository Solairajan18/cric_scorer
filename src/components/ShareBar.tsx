"use client";

import { useState } from "react";
import { Match } from "@/types/match";
import { BottomSheet } from "./BottomSheet";

type Props = {
  title: string;
  text: string;
  url?: string;
  match?: Match;
};

export function ShareBar({ title, text, url: propUrl, match }: Props) {
  const [open, setOpen] = useState(false);

  async function handleShareLink() {
    const url = propUrl || window.location.href;
    if (navigator.share) {
      await navigator.share({ title, text, url });
    } else {
      await navigator.clipboard.writeText(url);
      window.alert("Link copied to clipboard");
    }
    setOpen(false);
  }

  function handleExportImage() {
    // This triggers the ref in the MatchPage/ReportSummary
    // We emit a custom event that MatchPage listens for
    window.dispatchEvent(new CustomEvent("export-match-image"));
    setOpen(false);
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)} 
        className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-emerald-800 shadow-lg shadow-emerald-100 border border-emerald-800 active:scale-95"
      >
        Share
      </button>

      <BottomSheet open={open} title="Share Match" onClose={() => setOpen(false)}>
        <div className="space-y-4 pb-6">
          <p className="text-xs font-medium text-slate-500 text-center mb-2">How would you like to share the match?</p>
          
          <div className="grid grid-cols-2 gap-4">
             <button 
               onClick={handleShareLink}
               className="flex flex-col items-center justify-center gap-3 rounded-[24px] bg-slate-50 border border-slate-100 p-6 transition hover:bg-white hover:shadow-xl hover:shadow-slate-200"
             >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Live Link</span>
             </button>

             <button 
               onClick={handleExportImage}
               className="flex flex-col items-center justify-center gap-3 rounded-[24px] bg-slate-50 border border-slate-100 p-6 transition hover:bg-white hover:shadow-xl hover:shadow-slate-200"
             >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Image Card</span>
             </button>
          </div>

          <button 
            onClick={() => setOpen(false)}
            className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
