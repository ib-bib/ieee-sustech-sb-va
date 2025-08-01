import { BellIcon, UserIcon } from "@heroicons/react/24/outline"
import Image from "next/image"
import Link from "next/link"
import { FlagsCard } from "../_components/flags_card"
import { CertCard } from "../_components/cert_card"

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
                <button className="size-8 flex justify-center items-center group shadow-2xl bg-blue-500 hover:bg-blue-800 hover:cursor-pointer rounded-full transition-all active:scale-90">
                    <BellIcon className="text-white size-6" />
                </button>
                <button
                    className="size-8 flex justify-center items-center group shadow-2xl bg-blue-500 hover:bg-blue-800 hover:cursor-pointer rounded-full transition-all active:scale-90">
                    <UserIcon className="text-white size-6" />
                </button>
            </div>
        </nav>
        <section className="w-full flex flex-wrap py-6 justify-center items-center gap-6 grow">
            <CertCard />
            <FlagsCard />
            <div className="hover:-translate-y-5 transition-all shadow-2xl rounded-3xl bg-transparent backdrop-blur-xs hover:cursor-pointer w-64 h-96 flex flex-col items-center justify-between py-2 font-bold">
                Your Ratings
            </div>
        </section>
    </main>
}