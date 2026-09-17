import { Blocks } from "lucide-react";
import { cn } from "@/lib/utils";

/** Marca do painel. Placeholder até termos o logo definitivo. */
export function Logo({
  className,
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Blocks className="size-5" />
      </span>
      {withText && (
        <span className="text-lg font-bold tracking-tight">
          Inphantil<span className="text-primary"> Cloud</span>
        </span>
      )}
    </span>
  );
}
