"use client";

import {
  LockClosedIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

export function AccountMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="group relative flex size-8 items-center justify-center rounded-full bg-blue-500 shadow-2xl transition-all hover:cursor-pointer hover:bg-blue-800 active:scale-90">
          <UserIcon className="size-6 text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-70">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="text-center leading-none font-medium">
              Ibrahim Adil
            </h4>
          </div>
          <div className="grid gap-2">
            <Button className="flex items-center justify-between bg-neutral-200 px-8 text-black transition-all hover:cursor-pointer hover:bg-neutral-300 active:scale-95">
              <LockClosedIcon className="size-6" />
              <Link href="/change_password">Change Password</Link>
              <div className="invisible size-6" />
            </Button>
            <Button className="flex items-center justify-between bg-neutral-900 px-8 transition-all hover:cursor-pointer hover:bg-black active:scale-95">
              <ArrowRightStartOnRectangleIcon className="size-6" />
              <span>Log Out</span>
              <div className="invisible size-6" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
