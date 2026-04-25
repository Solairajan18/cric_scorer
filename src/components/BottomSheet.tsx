"use client";

export function BottomSheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/55" onClick={onClose}>
      <div className="w-full rounded-t-[28px] border-t-2 border-[var(--outline-variant)] bg-[var(--background)] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--outline-variant)]" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-[var(--primary)]">{title}</h2>
          <button onClick={onClose} className="rounded-lg bg-[var(--surface-soft)] px-3 py-1.5 text-sm font-medium text-slate-700">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
