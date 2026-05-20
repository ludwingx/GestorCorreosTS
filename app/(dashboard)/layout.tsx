import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Cloud } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset className="bg-zinc-50/40 dark:bg-zinc-950/10 min-h-screen flex flex-col">
        {/* Floating/Glassmorphic Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-200/50 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-6 transition-all duration-300">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg p-1.5" />
            <Separator orientation="vertical" className="mx-2 h-4 bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Gestión
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Panel General
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Microsoft Connection Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 dark:border-emerald-400/10 bg-emerald-500/5 dark:bg-emerald-400/5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Cloud className="h-3.5 w-3.5" />
              <span>OneDrive & Outlook Conectados</span>
            </div>

            {/* Quick Actions Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col gap-6 p-6 md:p-8 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

