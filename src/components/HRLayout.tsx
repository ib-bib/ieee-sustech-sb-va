"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  BarChart3,
  Calendar,
  Home,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { NotificationBell } from "~/app/_components/notification_bell";
import { UserMenu } from "~/app/_components/hr_user_menu";
import { AnimatedBackground } from "~/app/_components/animated_background";
import Image from "next/image";

interface HRLayoutProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
}

export function HRLayout({ children, userName, userRole }: HRLayoutProps) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = [
    { path: "/hr", label: "Home", icon: Home },
    { path: "/hr/team", label: "Team Members", icon: Users },
    { path: "/hr/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/hr/meetings", label: "Meetings", icon: Calendar },
  ];

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            >
              {isMobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <Link href="/" className="w-8 sm:w-9 md:w-10 lg:w-11 xl:w-12">
              <div
                style={{ position: "relative", width: "40px", height: "40px" }}
              >
                <Image
                  src="/IEEE-Branch-logo-blue-bg_transparent.png"
                  alt="IEEE SUSTech Student Branch"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 sm:inline-flex">
              {userName}
            </div>
            <NotificationBell userRole={userRole} />
            <UserMenu
              userName={userName}
              userRole={userRole}
              userTeam={"Event"}
              onLogout={() => {
                window.location.href = "/login";
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative flex min-h-[calc(100vh-72px)]">
        <aside
          className={cn(
            "flex flex-col border-r border-[#004d70] bg-gradient-to-b from-[#00629B] to-[#005280]",
            "fixed top-[73px] left-0 z-40 h-[calc(100vh-73px)] overflow-x-hidden overflow-y-auto lg:sticky",
            "transition-[width] duration-[300ms]",
            // DELAY: When collapsing, wait 300ms (text 150 + icon 150). When opening, start immediately.
            isSidebarCollapsed ? "w-20 delay-[300ms]" : "w-64 delay-0",
            isMobileNavOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
          )}
        >
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/hr"
                  ? pathname === "/hr"
                  : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "relative flex h-12 items-center overflow-hidden rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {/* ICON CONTAINER: Handles the sliding/centering */}
                  <div
                    className={cn(
                      "absolute flex items-center justify-center transition-all duration-[150ms]",
                      // When collapsing: wait for text (150ms). When opening: wait for sidenav (150ms).
                      isSidebarCollapsed
                        ? "left-1/2 -translate-x-1/2 delay-[150ms]"
                        : "left-4 translate-x-0 delay-[150ms]",
                      "h-5 w-5",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </div>

                  {/* TEXT LABEL: Handles the fading */}
                  <span
                    className={cn(
                      "pl-12 whitespace-nowrap transition-opacity duration-[150ms]",
                      // When collapsing: start immediately. When opening: wait for everything (450ms).
                      isSidebarCollapsed
                        ? "opacity-0 delay-0"
                        : "opacity-100 delay-[450ms]",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Collapse Button Area */}
          <div className="hidden border-t border-[#004d70] p-4 lg:block">
            <Button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="group flex h-12 w-full items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <div
                className={cn(
                  "transition-transform duration-[450ms] ease-in-out",
                  isSidebarCollapsed ? "rotate-180" : "rotate-0",
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </div>

              {/* "Collapse" text follows the same fade logic as nav items */}
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-[150ms]",
                  isSidebarCollapsed
                    ? "w-0 opacity-0 delay-0"
                    : "ml-2 w-auto opacity-100 delay-[450ms]",
                )}
              >
                Collapse
              </span>
            </Button>
          </div>
        </aside>

        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        <main
          className={cn(
            "flex-1 p-4 transition-all duration-300 sm:p-6 lg:p-8",
            isSidebarCollapsed ? "lg:pl-24" : "lg:pl-64",
          )}
        >
          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
