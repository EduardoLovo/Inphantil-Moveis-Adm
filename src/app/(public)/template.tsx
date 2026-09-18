import { PageTransition } from "@/components/motion/page-transition";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition className="flex flex-1 flex-col">{children}</PageTransition>
  );
}
