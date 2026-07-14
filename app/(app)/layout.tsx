import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 sm:px-6">
          <Link href="/closet" className="text-lg font-semibold tracking-tight">
            Capsule
          </Link>
        </div>
      </header>
      {/* pb clears the floating bottom bar (h-16 + offset) + raised stylist button */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-6 sm:px-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
