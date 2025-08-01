"use server"

import { Dialog, DialogTrigger, DialogFooter, DialogHeader, DialogTitle, DialogContent } from "~/components/ui/dialog";
import {
    Card,
    CardContent,
} from "~/components/ui/card"

import { api } from "~/trpc/server";

export const CertCard = async () => {
    const { suggestions, general, team, percentage } = await api.cert.getStatus()

    return <Dialog>
        <DialogTrigger asChild>
            <div className="hover:-translate-y-5 transition-all shadow-2xl rounded-3xl bg-transparent backdrop-blur-xs hover:cursor-pointer w-64 h-96 flex flex-col items-center py-2">
                <div className="w-full flex flex-col h-1/2 gap-8">
                    <h3 className="text-center font-bold w-full">Certification Status</h3>

                    <div className="flex relative w-full justify-center items-center size-40">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-gray-200 dark:text-neutral-700" strokeWidth="2"></circle>
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

                        <div className="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                            <span className="text-center text-2xl font-bold text-blue-600 dark:text-blue-500">{percentage} %</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-end items-center h-1/2 w-full text-center px-2 pb-8 space-y-2">
                    {
                        suggestions.length == 0 && <p className="text-sm">
                            Well done! You have earned your certification! 💯🤩
                        </p>
                    }
                    {
                        suggestions.length == 1 && <p className="text-sm">
                            You&apos;re so close! Just one more step left to take! ⏳
                        </p>
                    }
                    {
                        suggestions.length > 1 && (general.fulfilled.length > 0 || team.fulfilled.length > 0) && <p className="text-sm">
                            Great work! Keep it up! 💪
                        </p>
                    }
                    {
                        suggestions.length > 1 && (general.fulfilled.length === 0 && team.fulfilled.length === 0) && <p className="text-sm">
                            The road is long ahead, but you&apos;ve got what it takes! 🌄
                        </p>
                    }
                </div>
            </div>
        </DialogTrigger>
        <DialogContent className="min-h-[500px] max-h-[800px] overflow-y-auto min-w-[300px] flex flex-col justify-between">
            <div className="flex flex-col gap-2 grow">
                <DialogHeader>
                    <DialogTitle className="text-center">Certification Status (Detailed View)</DialogTitle>
                </DialogHeader>
                <Card className="flex flex-col grow h-full">
                    <CardContent className="flex flex-col gap-4 h-full overflow-hidden pr-2">
                        <div className="flex relative w-full justify-center items-center size-40 shrink-0">
                            <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    className="stroke-current text-gray-200 dark:text-neutral-700"
                                    strokeWidth="2"
                                />
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

                            <div className="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                <span className="text-center text-2xl font-bold text-blue-600 dark:text-blue-500">
                                    {percentage} %
                                </span>
                            </div>
                        </div>

                        <h3 className="font-medium text-muted-foreground text-center">Conditions you've already fulfilled</h3>

                        <div className="overflow-y-auto flex-grow-0 max-h-40">
                            <ul className="list-disc pl-5 space-y-2">
                                {[...general.fulfilled, ...team.fulfilled].map((fulfilled) => (
                                    <li key={fulfilled.id} className="text-sm leading-relaxed break-words">
                                        <span className="font-semibold">{fulfilled.description}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <h3 className="font-medium text-muted-foreground text-center">Suggestions on what to do next</h3>

                        <div className="overflow-y-auto flex-grow min-h-0">
                            <ul className="list-disc pl-5 space-y-2">
                                {suggestions.map((suggestion) => (
                                    <li key={suggestion.id} className="text-sm leading-relaxed break-words">
                                        <span className="font-semibold">{suggestion.description}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
                <DialogFooter className="pt-4">
                    <div className="flex justify-center text-center w-full flex-col items-center space-y-1 px-4">
                        {suggestions.length === 0 && (
                            <p className="text-sm">Well done! You have earned your certification! 💯🤩</p>
                        )}
                        {suggestions.length === 1 && (
                            <p className="text-sm">You&apos;re so close! Just one more step left to take! ⏳</p>
                        )}
                        {suggestions.length > 1 && (general.fulfilled.length > 0 || team.fulfilled.length > 0) && (
                            <p className="text-sm">Great work! Keep it up! 💪</p>
                        )}
                        {suggestions.length > 1 && (general.fulfilled.length === 0 && team.fulfilled.length === 0) && (
                            <p className="text-sm">The road is long ahead, but you&apos;ve got what it takes! 🌄</p>
                        )}
                    </div>
                </DialogFooter>
            </div>
        </DialogContent>
    </Dialog>
}