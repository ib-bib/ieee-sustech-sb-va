"use client"

import { LockClosedIcon, UserIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline"
import { Button } from "~/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"

export function AccountMenu() {

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button className="relative size-8 flex justify-center items-center group shadow-2xl bg-blue-500 hover:bg-blue-800 hover:cursor-pointer rounded-full transition-all active:scale-90">
                    <UserIcon className="text-white size-6" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-70">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="leading-none font-medium text-center">Ibrahim Adil</h4>
                    </div>
                    <div className="grid gap-2">
                        <Button className="bg-neutral-200 text-black flex items-center justify-between hover:bg-neutral-300 transition-all active:scale-95 hover:cursor-pointer px-8">
                            <LockClosedIcon className="size-6" />
                            <span>Change Password</span>
                            <div className="size-6 invisible" />
                        </Button>
                        <Button className="bg-neutral-900 flex items-center justify-between hover:bg-black transition-all active:scale-95 hover:cursor-pointer px-8">
                            <ArrowRightStartOnRectangleIcon className="size-6" />
                            <span>Log Out</span>
                            <div className="size-6 invisible" />
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
