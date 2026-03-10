"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/session";
import { useLogout } from "@/lib/auth/hooks";

export function CompanyHeader(props: {
  companyId: string;
  onOpenNav?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const logout = useLogout();

  const label = session.company?.name ?? props.companyId;

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="flex h-14 items-center gap-3 px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={props.onOpenNav}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href={`/c/${props.companyId}/dashboard`} className="font-semibold">
          GST Billing
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/dashboard" className="text-sm text-neutral-600 hover:underline">
            Switch
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <span className="max-w-[18ch] truncate">{label}</span>
                <ChevronsUpDown className="h-4 w-4 text-neutral-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1.5">
                <div className="text-xs text-neutral-500">Signed in as</div>
                <div className="text-sm font-medium truncate">{session.user?.email ?? "—"}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async (e) => {
                  e.preventDefault();
                  await logout.mutateAsync();
                  router.replace("/login");
                }}
                className={cn(logout.isPending && "opacity-60 pointer-events-none")}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logout.isPending ? "Signing out…" : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-4 pb-2 text-[11px] text-neutral-500 truncate">
        /c/{props.companyId}
        {pathname?.split(`/c/${props.companyId}`)[1] || ""}
      </div>
    </header>
  );
}
