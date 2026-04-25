"use client";

import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/solid";
import { signOut } from "next-auth/react";
export default function SignOutButtonHome() {
  return (
    <button
      className="group flex cursor-pointer items-center gap-1 text-xl underline-offset-4 transition-all delay-300 hover:underline"
      onClick={async () => await signOut()}
    >
      Sign out
      <ArrowRightStartOnRectangleIcon className="size-4" />
    </button>
  );
}
