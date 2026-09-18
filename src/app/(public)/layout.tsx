import { PublicHeader } from "./public-header";

/** Layout público (vitrine): limpo, sem sidebar. */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground md:px-6">
          © {new Date().getFullYear()} Inphantil · Móveis infantis
        </div>
      </footer>
    </div>
  );
}
