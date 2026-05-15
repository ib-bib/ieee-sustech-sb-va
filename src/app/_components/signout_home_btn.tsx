"use client";

import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/solid";
import { signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";

export default function SignOutButtonHome() {
  return (
    <Button
      className="group flex items-center gap-1 text-xl underline-offset-4 transition-all delay-300 hover:underline"
      onClick={async () => await signOut()}
    >
      Sign out
      <ArrowRightStartOnRectangleIcon className="size-4" />
    </Button>
  );
}
