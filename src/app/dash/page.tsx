import { BellIcon, UserIcon } from "@heroicons/react/24/outline"
import { FlagIcon } from "@heroicons/react/24/solid"
import Image from "next/image"
import Link from "next/link"
import { Dialog, DialogTrigger, DialogFooter, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogClose } from "~/components/ui/dialog";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function Dash() {
    const session = await auth();
    const flags = await api.flag.getMyFlags()

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
            <div className="hover:-translate-y-5 transition-all shadow-2xl rounded-3xl bg-transparent backdrop-blur-xs hover:cursor-pointer w-64 h-96 flex flex-col items-center justify-between py-2">
                Your Progress
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <div className="hover:-translate-y-5 transition-all shadow-2xl rounded-3xl bg-transparent backdrop-blur-xs hover:cursor-pointer w-64 h-96 flex flex-col items-center py-2">
                        <div className="w-full flex flex-col h-1/2 gap-8">
                            <h3 className="text-center font-bold w-full">Your Flags</h3>
                            <div className="flex gap-6 justify-center items-center w-full">
                                <FlagIcon className="text-yellow-400 size-12" />
                                <span className="text-2xl">{flags.yellow_flags.length}</span>
                            </div>
                            <div className="flex gap-6 justify-center items-center w-full">
                                <FlagIcon className="text-red-600 size-12" />
                                <span className="text-2xl">{flags.red_flags.length}</span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center items-center h-1/2 w-full text-center px-2 space-y-2">
                            {flags.yellow_flags.length === 0 && flags.red_flags.length === 0 && (
                                <p>You are in the clear this month! Good work 🙂</p>
                            )}

                            {flags.yellow_flags.length > 0 && (
                                <p>
                                    You need to obtain a rating of at least 70% this month to remove
                                    {flags.yellow_flags.length === 1 ? " your yellow flag." : " a yellow flag."}
                                </p>
                            )}

                            {flags.red_flags.length > 0 && (
                                <p>
                                    You need to obtain a rating of at least 75% this month to remove
                                    {flags.red_flags.length === 1 ? " your red flag." : " a red flag."}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit profile</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when you&apos;re
                            done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-3">
                            <label htmlFor="name-1">Name</label>
                            <input id="name-1" name="name" defaultValue="Pedro Duarte" />
                        </div>
                        <div className="grid gap-3">
                            <label htmlFor="username-1">Username</label>
                            <input id="username-1" name="username" defaultValue="@peduarte" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            {/* <Button variant="outline">Cancel</Button> */}
                            <button>Cancel</button>
                        </DialogClose>
                        <button type="submit">Save changes</button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="hover:-translate-y-5 transition-all shadow-2xl rounded-3xl bg-transparent backdrop-blur-xs hover:cursor-pointer w-64 h-96 flex flex-col items-center justify-between py-2 font-bold">
                Your Ratings
            </div>
        </section>
    </main>
}