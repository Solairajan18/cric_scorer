"use client";

type Props = {
  title: string;
  text: string;
};

export function ShareBar({ title, text }: Props) {
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    window.alert("Link copied to clipboard");
  }

  return (
    <button onClick={handleShare} className="rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700">
      Share live link
    </button>
  );
}
