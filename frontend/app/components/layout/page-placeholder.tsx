import type { LucideIcon } from "lucide-react";

/**
 * Intentional empty state for sections that exist in the navigation but aren't
 * built yet. Keeps every nav link functional instead of 404ing.
 */
export function PagePlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 ring-1 ring-indigo-500/20 shadow-inner shadow-indigo-500/5">
        <Icon className="size-5 text-indigo-300" />
      </div>
      <h2 className="mt-4 font-heading text-lg font-semibold text-white/90">
        {title}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-white/60">{description}</p>
    </div>
  );
}