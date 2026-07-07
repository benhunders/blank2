import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 sm:px-6">
          <Link href="/closet" className="text-lg font-semibold tracking-tight">
            Capsule
          </Link>
        </div>
      </header>
      {/* pb clears the fixed bottom bar (h-16) + the raised stylist button */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
