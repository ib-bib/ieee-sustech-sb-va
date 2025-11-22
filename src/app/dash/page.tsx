import Image from "next/image";
import Link from "next/link";
import { FlagsCard } from "~/app/_components/flags_card";
import { CertCard } from "~/app/_components/cert_card";
import RatingsCard from "~/app/_components/ratings_card";
import { NotificationsMenu } from "../_components/notifications_menu";
import { AccountMenu } from "../_components/account_menu";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function Dash() {
  const session = await auth();

  if (!session) redirect("/");

  return (
    <main className="flex h-full min-h-screen w-full flex-col">
      <nav className="itesm-center flex h-13 w-full justify-between bg-blue-700 px-4">
        <div className="flex h-full items-center">
          <Link href="/" className="w-8 sm:w-9 md:w-10 lg:w-11 xl:w-12">
            <Image
              src="/IEEE-Branch-logo-white.png"
              alt="IEEE SUSTech Student Branch"
              width={40}
              height={40}
              priority
            />
          </Link>
        </div>
        <div className="flex h-full items-center justify-end gap-4">
          <NotificationsMenu />
          <AccountMenu username={session?.user.name ?? "Server Error"} />
        </div>
      </nav>
      <section className="flex w-full grow flex-wrap items-center justify-center gap-6 py-6">
        <CertCard />
        <FlagsCard />
        <RatingsCard />
      </section>
    </main>
  );
}
