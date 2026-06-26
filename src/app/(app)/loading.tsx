/**
 * Calm route-group loading skeleton. Mirrors the app shell spacing
 * (`space-y-6`) with a few quiet shimmer blocks — a tall card, a 2-col grid of
 * medium blocks, and a couple of rows. No text, respects reduced motion via the
 * global stylesheet.
 */
export default function Loading() {
  return (
    <div className="space-y-6" aria-hidden>
      {/* Tall card (e.g. balance / owner card) */}
      <div className="h-36 w-full animate-pulse rounded-2xl bg-secondary" />

      {/* 2-col grid of medium blocks */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      </div>

      {/* A few rows */}
      <div className="space-y-3">
        <div className="h-16 w-full animate-pulse rounded-2xl bg-secondary" />
        <div className="h-16 w-full animate-pulse rounded-2xl bg-secondary" />
        <div className="h-16 w-4/5 animate-pulse rounded-2xl bg-secondary" />
      </div>
    </div>
  );
}
