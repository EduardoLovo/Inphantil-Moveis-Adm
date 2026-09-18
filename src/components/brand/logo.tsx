import Image from "next/image";
import { cn } from "@/lib/utils";

/** Marca do painel: elefantinho + "Inphantil Móveis". */
export function Logo({
  className,
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-neutral-900 shadow-sm">
        <Image
          src="/logo.png"
          alt="Inphantil Móveis"
          width={40}
          height={40}
          priority
          className="size-7 object-contain"
        />
      </span>
      {withText && (
        <span className="text-lg font-bold tracking-tight">
          Inphantil<span className="text-primary"> Móveis</span>
        </span>
      )}
    </span>
  );
}
