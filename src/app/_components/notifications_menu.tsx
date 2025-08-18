"use client"

import { useState } from "react"
import { BellIcon } from "@heroicons/react/24/outline"
import { Button } from "~/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import { Separator } from "~/components/ui/separator"

export function NotificationsMenu() {
    const [notifs, setNotifs] = useState([
        { id: 1, text: "Test Notification A", status: "u" },
        { id: 2, text: "Test Notification B", status: "u" },
        { id: 3, text: "Test Notification C", status: "u" },
    ])

    const handleNotifClick = (id: number) => {
        setNotifs(prev =>
            prev.map(n => (n.id === id ? { ...n, status: "r" } : n))
        )
    }

    const sortedNotifs = [...notifs].sort((a, b) =>
        a.status === b.status ? 0 : a.status === "u" ? -1 : 1
    )
    const firstReadIndex = sortedNotifs.findIndex(n => n.status === "r")

    const hasUnread = notifs.some(n => n.status === "u")

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button className="relative size-8 flex justify-center items-center group shadow-2xl bg-blue-500 hover:bg-blue-800 hover:cursor-pointer rounded-full transition-all active:scale-90">
                    <BellIcon className="text-white size-6" />
                    {hasUnread && (
                        <span className="absolute top-1 right-1 block size-2 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="leading-none font-medium">Notifications</h4>
                        <p className="text-muted-foreground text-sm">
                            See your latest updates.
                        </p>
                    </div>
                    <div id="notifs_div" className="grid gap-2">
                        {sortedNotifs.map((n, i) => (
                            <div key={n.id}>
                                {i === firstReadIndex && <Separator className="my-1" />}
                                <div
                                    onClick={() => handleNotifClick(n.id)}
                                    className={`border rounded-xl p-2 text-sm text-center cursor-pointer transition 
                    ${n.status === "u" ? "bg-blue-100 hover:bg-blue-200" : "bg-gray-50 hover:bg-gray-100"}`}
                                >
                                    {n.text} {n.status === "r" && "- Read"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
