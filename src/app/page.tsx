import Link from "next/link";
import { ArrowRightIcon, ArrowRightStartOnRectangleIcon, ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'

import { auth } from "~/server/auth";
import Image from "next/image";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-transparent backdrop-blur-[2px]">

      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40">
          <Image
            src="/IEEE-Branch-logo-blue-bg_transparent.png"
            alt="IEEE SUSTech Student Branch"
            width={500}
            height={500}
            className="w-full h-auto"
            priority
          />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
          Official <span className="text-[#00629B]">IEEE SUSTech SB</span> Volunteer App
        </h1>
        <div className="w-full flex gap-1 items-center justify-center">
          <h2 className="text-lg font-extrabold tracking-tight sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
            Web App Under Construction
          </h2>
          <ExclamationTriangleIcon className="text-[#FFC72C] size-5 sm:size-6 md:size-7 lg:size-8 xl:size-9" />
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-center text-2xl">
            {session && <span>Logged in as {session.user?.name} - {session.user?.email}</span>}
          </p>
          <Link
            href={session ? "/api/auth/signout" : "/login"}
            className="group underline-offset-4 text-xl transition-all delay-300 hover:underline flex gap-1 items-center"
          >
            {session ? "Sign out" : "Sign in"}
            {session ? <ArrowRightStartOnRectangleIcon className="size-4" /> : <><ChevronRightIcon className="size-4 group-hover:hidden" />
              <ArrowRightIcon className="size-4 group-hover:block hidden" /></>}
          </Link>
        </div>
      </div>
    </main>
  );
}
