import { auth } from "@/lib/auth";
import { PublicHeader } from "./public-header";

/** Layout público (vitrine): limpo, sem sidebar. */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader loggedIn={!!session?.user} />

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground md:px-6">
          © {new Date().getFullYear()} Inphantil · Móveis infantis
        </div>
      </footer>
    </div>
  );
}
