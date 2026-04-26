"use client";

type Props = {
  title: string;
  text: string;
  url?: string;
  onClick?: () => void;
};

export function ShareBar({ title, text, url: propUrl, onClick }: Props) {
  async function handleShare() {
    if (onClick) {
      onClick();
      return;
    }

    const url = propUrl || window.location.href;

    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    window.alert("Link copied to clipboard");
  }

  return (
    <button onClick={handleShare} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm border border-emerald-900">
      Share
    </button>
  );
}
