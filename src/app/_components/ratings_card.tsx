"use server";

import {
    Dialog,
    DialogTrigger,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogContent,
} from "~/components/ui/dialog";
import { Card, CardContent } from "~/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "~/components/ui/tabs"

import { api } from "~/trpc/server";
import { CircularProgressBar } from "~/app/_components/circular_progress_bar";

export default async function RatingsCard() {
    return <Dialog>
        <DialogTrigger asChild>
            <div className="hover:-translate-y-5 transition-all shadow-2xl rounded-3xl bg-transparent backdrop-blur-xs hover:cursor-pointer w-64 h-96 flex flex-col items-center justify-between py-2">
                <div className="w-full flex flex-col h-1/2 gap-8">
                    <h3 className="text-center font-bold w-full">Your Ratings</h3>
                    <div className="flex flex-col gap-6 justify-center items-center w-full">
                        <div className="w-full flex flex-col items-center gap-1">
                            <p>Last month's rating</p>
                            <div className="relative size-20">
                                <svg className="size-full -rotate-90" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="9" cy="9" r="8" fill="none" className="stroke-current text-gray-200 dark:text-neutral-700" strokeWidth="2"></circle>
                                    <circle cx="9" cy="9" r="8" fill="none" className="stroke-current text-blue-600 dark:text-blue-500" strokeWidth="2" strokeDasharray="100" strokeDashoffset="65" strokeLinecap="round"></circle>
                                </svg>

                                <div className="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                    <span className="text-center text-2xl font-bold text-blue-600 dark:text-blue-500">35%</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full flex flex-col items-center gap-1">
                            <p>Average Rating</p>
                            <div className="relative size-20">
                                <svg className="size-full -rotate-90" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="9" cy="9" r="8" fill="none" className="stroke-current text-gray-200 dark:text-neutral-700" strokeWidth="2"></circle>
                                    <circle cx="9" cy="9" r="8" fill="none" className="stroke-current text-blue-600 dark:text-blue-500" strokeWidth="2" strokeDasharray="100" strokeDashoffset="65" strokeLinecap="round"></circle>
                                </svg>

                                <div className="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                    <span className="text-center text-2xl font-bold text-blue-600 dark:text-blue-500">35%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-6 justify-center items-center w-full">
                    </div>
                </div>
                <div className="flex flex-col justify-end items-center h-1/2 w-full text-center px-2 pb-4 space-y-2">

                </div>
            </div>
        </DialogTrigger>
        <DialogContent className="min-h-[500px] max-h-[800px] overflow-y-auto min-w-[300px] flex flex-col justify-between">
            <div className="flex flex-col gap-2 grow">
                <DialogHeader>
                    <DialogTitle className="text-center">Your Flags (Detailed View)</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="current" className="grow flex flex-col">
                    <TabsList className="w-full mt-0 mb-2">
                        <TabsTrigger value="current">Current Ratings</TabsTrigger>
                        <TabsTrigger value="history">Your Rating History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="current" className="flex flex-col grow h-full">
                        <Card className="flex flex-col grow h-full">
                            <CardContent className="flex flex-col gap-4 overflow-y-auto h-[300px] pr-2">
                                Test for Current
                                <div className="relative flex size-40 w-full items-center justify-center">
                                    <svg
                                        className="size-full -rotate-90"
                                        viewBox="0 0 36 36"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="16"
                                            fill="none"
                                            className="stroke-current text-gray-200 dark:text-neutral-700"
                                            strokeWidth="2"
                                        ></circle>
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="16"
                                            fill="none"
                                            className="stroke-current text-blue-600 dark:text-blue-500"
                                            strokeWidth="2"
                                            strokeDasharray="100"
                                            strokeDashoffset={`${100 - Number(percentage)}`}
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    <div className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                                        <span className="text-center text-2xl font-bold text-blue-600 dark:text-blue-500">
                                            {percentage} %
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="flex flex-col grow h-full">
                        <Card className="flex flex-col grow h-full">
                            <CardContent className="flex flex-col gap-4 overflow-y-auto h-[300px] pr-2">
                                This should be a chart
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
            <DialogFooter className="pt-4">
                <div className="flex justify-center text-center w-full flex-col items-center space-y-1 px-4">
                    Make sure you stay above 75% every month to maintain a good track record
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}