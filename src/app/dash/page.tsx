
import Image from "next/image"
import Link from "next/link"
import { FlagsCard } from "~/app/_components/flags_card"
import { CertCard } from "~/app/_components/cert_card"
import RatingsCard from "~/app/_components/ratings_card"
import { NotificationsMenu } from "../_components/notifications_menu"
import { AccountMenu } from "../_components/account_menu"

export default async function Dash() {

    return <main className="h-full w-full min-h-screen flex flex-col">
        <nav className="w-full flex itesm-center justify-between bg-blue-700 h-13 px-4">
            <div className="h-full flex items-center">
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
            <div className="flex gap-4 items-center h-full justify-end">
                <NotificationsMenu />
                <AccountMenu />
            </div>
        </nav>
        <section className="w-full flex flex-wrap py-6 justify-center items-center gap-6 grow">
            <CertCard />
            <FlagsCard />
            <RatingsCard />
        </section>
    </main>
}