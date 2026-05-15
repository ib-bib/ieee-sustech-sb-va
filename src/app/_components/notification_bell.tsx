"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

interface Notification {
  id: string;
  from: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationBellProps {
  userRole: string;
}

export function NotificationBell({ userRole }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const mockNotifications: Notification[] =
    userRole === "HR Leader"
      ? [
        {
          id: "1",
          from: "President",
          message: "Please review the new team member applications",
          timestamp: "2 hours ago",
          read: false,
        },
        {
          id: "2",
          from: "Vice President",
          message: "Analytics report for Q1 is ready",
          timestamp: "5 hours ago",
          read: false,
        },
        {
          id: "3",
          from: "Secretary",
          message: "Meeting minutes have been updated",
          timestamp: "1 day ago",
          read: true,
        },
      ]
      : [
        {
          id: "1",
          from: "HR Leader",
          message: "Your leave request has been approved",
          timestamp: "1 hour ago",
          read: false,
        },
        {
          id: "2",
          from: "HR Leader",
          message: "Team meeting scheduled for tomorrow at 10 AM",
          timestamp: "3 hours ago",
          read: false,
        },
      ];

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""
                }`
                : "All caught up!"}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {mockNotifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              mockNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border p-4 transition-colors ${notification.read
                    ? "border-gray-200 bg-white"
                    : "border-blue-200 bg-blue-50"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {notification.from}
                        </span>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {notification.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
