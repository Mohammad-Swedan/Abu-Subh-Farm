import { requireUser } from "@/lib/auth";
import { getCashBalanceFils } from "@/lib/ledger/ledger.service";
import { AppHeader, BottomNav } from "@/components/layout";

/**
 * Protected shell for the whole app. `requireUser()` enforces auth server-side
 * (middleware is only a coarse cookie gate). The header shows the LIVE cash
 * balance read from the shared ledger service.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const balanceFils = await getCashBalanceFils();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col bg-background">
      <AppHeader balanceFils={balanceFils} />
      <main className="flex-1 px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
