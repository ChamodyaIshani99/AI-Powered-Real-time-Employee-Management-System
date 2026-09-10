import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Rounded brand mark — used on the login page and in the app sidebar. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        "bg-gradient-to-br from-indigo-500 to-purple-600 text-white",
        "shadow-md shadow-indigo-500/20 ring-1 ring-white/20",
        className
      )}
    >
      <Building2 className="size-5" />
    </span>
  );
}

/** Brand mark + wordmark. Inherits text color from its parent. */
export function BrandHeader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark />
      <div className="leading-tight">
        <p className="font-heading text-base font-semibold tracking-tight">
          EMS
        </p>
        <p className="text-xs font-medium opacity-80">
          Employee Management System
        </p>
      </div>
    </div>
  );
}