import { BellIcon, UserIcon } from "@heroicons/react/24/outline"
import { FlagIcon } from "@heroicons/react/24/solid"
import Image from "next/image"
import Link from "next/link"

import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

import { Dialog, DialogTrigger, DialogFooter, DialogHeader, DialogTitle, DialogContent } from "~/components/ui/dialog";
import {
    Card,
    CardContent,
} from "~/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "~/components/ui/tabs"

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
                                <p className="text-sm">
                                    You need to obtain a rating of at least 70% this month to remove
                                    {flags.yellow_flags.length === 1 ? " your yellow flag." : " a yellow flag."}
                                </p>
                            )}

                            {flags.red_flags.length > 0 && (
                                <p className="text-sm">
                                    You need to obtain a rating of at least 75% this month to remove
                                    {flags.red_flags.length === 1 ? " your red flag." : " a red flag."}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogTrigger>
                <DialogContent className="min-h-[500px] max-h-[800px] overflow-y-auto min-w-[300px] flex flex-col justify-between overl">
                    <div className="flex flex-col gap-2 grow">
                        <DialogHeader>
                            <DialogTitle className="text-center">Your Flags (Detailed View)</DialogTitle>
                        </DialogHeader>

                        <Tabs defaultValue="red" className="grow flex flex-col">
                            <TabsList className="w-full mt-0 mb-2">
                                <TabsTrigger value="red">Red {flags.red_flags.length}</TabsTrigger>
                                <TabsTrigger value="yellow">Yellow {flags.yellow_flags.length}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="red" className="flex flex-col grow h-full">
                                <Card className="flex flex-col grow h-full">
                                    <CardContent className="flex flex-col gap-4 overflow-y-auto h-[300px] pr-2">
                                        {flags.red_flags.map((red_flag, i) => (
                                            <div
                                                key={`red-${i}`}
                                                className="flex w-full"
                                            >
                                                <div className="w-[10%] flex justify-center items-start pt-1">
                                                    <FlagIcon className="text-red-600 size-6 shrink-0" />
                                                </div>
                                                <div className="w-[90%] text-sm leading-relaxed break-words">
                                                    <span className="font-semibold">
                                                        {red_flag.givenAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                    &nbsp;-&nbsp;
                                                    <span>{red_flag.reason}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="yellow" className="flex flex-col grow h-full">
                                <Card className="flex flex-col grow h-full">
                                    <CardContent className="flex flex-col gap-4 overflow-y-auto h-[300px] pr-2">
                                        {flags.yellow_flags.map((yellow_flag, i) => (
                                            <div key={`yellow-${i}`} className="flex w-full">
                                                <div className="w-[10%] flex justify-center items-start pt-1">
                                                    <FlagIcon className="text-yellow-400 size-6 shrink-0" />
                                                </div>
                                                <div className="w-[90%] text-sm leading-relaxed break-words">
                                                    <span className="font-semibold">
                                                        {yellow_flag.givenAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                    &nbsp;-&nbsp;
                                                    <span>
                                                        {yellow_flag.reason}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                        </Tabs>
                    </div>
                    <DialogFooter className="pt-4">
                        <div className="flex justify-center text-center w-full flex-col items-center space-y-1 px-4">
                            {flags.yellow_flags.length === 0 && flags.red_flags.length === 0 && (
                                <p>You are in the clear this month! Good work 🙂</p>
                            )}

                            {flags.yellow_flags.length > 0 && (
                                <p className="text-sm">
                                    You need to obtain a rating of at least 70% this month to remove
                                    {flags.yellow_flags.length === 1
                                        ? " your yellow flag."
                                        : " a yellow flag."}
                                </p>
                            )}

                            {flags.red_flags.length > 0 && (
                                <p className="text-sm">
                                    You need to obtain a rating of at least 75% this month to remove
                                    {flags.red_flags.length === 1
                                        ? " your red flag."
                                        : " a red flag."}
                                </p>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="hover:-translate-y-5 transition-all shadow-2xl rounded-3xl bg-transparent backdrop-blur-xs hover:cursor-pointer w-64 h-96 flex flex-col items-center justify-between py-2 font-bold">
                Your Ratings
            </div>
        </section>
    </main>
}