"use client";

import { BellIcon, ArchiveBoxIcon, TrashIcon, CheckIcon, ArrowUturnUpIcon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function NotificationsMenu() {
  const utils = api.useUtils();

  const { data: inboxNotifs = [], isLoading: isLoadingInbox } = api.notif.getUnclearedNotifications.useQuery();
  const { data: archiveNotifs = [], isLoading: isLoadingArchive } = api.notif.getArchivedNotifications.useQuery();

  const readMutation = api.notif.readNotification.useMutation({
    onSuccess: () => {
      void utils.notif.getUnclearedNotifications.invalidate();
    },
    onError: () => toast.error("Failed to mark notification as read"),
  });

  const clearMutation = api.notif.clearNotification.useMutation({
    onSuccess: () => {
      void utils.notif.getUnclearedNotifications.invalidate();
      void utils.notif.getArchivedNotifications.invalidate();
    },
    onError: () => toast.error("Failed to archive notification"),
  });

  const unarchiveMutation = api.notif.unarchiveNotification.useMutation({
    onSuccess: () => {
      void utils.notif.getUnclearedNotifications.invalidate();
      void utils.notif.getArchivedNotifications.invalidate();
    },
    onError: () => toast.error("Failed to unarchive notification"),
  });

  const deleteMutation = api.notif.deleteNotification.useMutation({
    onSuccess: () => {
      void utils.notif.getArchivedNotifications.invalidate();
    },
    onError: () => toast.error("Failed to permanently delete notification"),
  });

  const unreadCount = inboxNotifs.filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="group relative flex size-10 items-center justify-center rounded-full bg-blue-500 shadow-2xl transition-all hover:bg-blue-700 active:scale-95">
          <BellIcon className="size-6 text-white" />
          {hasUnread && (
            <span className="absolute top-1 right-1 block size-3 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-88 p-4 shadow-xl" align="end">
        <div className="flex flex-col gap-4">
          <div>
            <h4 className="text-lg font-semibold leading-none tracking-tight">Notifications</h4>
            <p className="text-muted-foreground text-sm">
              Stay up to date with the latest team activities.
            </p>
          </div>

          <Tabs defaultValue="inbox" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbox">
                Inbox
                {unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="archive">Archive</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="mt-4 max-h-80 overflow-y-auto pr-1">
              {isLoadingInbox ? (
                <div className="py-4 text-center text-sm text-gray-500">Loading...</div>
              ) : inboxNotifs.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  You have no new notifications.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {inboxNotifs.map((n) => (
                    <div
                      key={n.id}
                      className={`group relative flex flex-col gap-1 rounded-xl border p-3 text-sm transition-colors ${
                        !n.isRead ? "border-blue-200 bg-blue-50/50" : "border-gray-100 bg-gray-50/40 hover:bg-gray-100/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-1 flex-col gap-1">
                          <p className={`leading-snug ${!n.isRead ? "font-medium text-gray-900" : "text-gray-400"}`}>
                            {n.message}
                          </p>
                          <span className={`text-xs ${!n.isRead ? "text-gray-500" : "text-gray-300"}`}>
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                          {!n.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                readMutation.mutate({ id: n.id });
                              }}
                              title="Mark as read"
                            >
                              <CheckIcon className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearMutation.mutate({ id: n.id });
                            }}
                            title="Archive"
                          >
                            <ArchiveBoxIcon className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="archive" className="mt-4 max-h-80 overflow-y-auto pr-1">
              {isLoadingArchive ? (
                <div className="py-4 text-center text-sm text-gray-500">Loading...</div>
              ) : archiveNotifs.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Your archive is empty.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {archiveNotifs.map((n) => (
                    <div
                      key={n.id}
                      className="group relative flex flex-col gap-1 rounded-xl border bg-gray-50/50 p-3 text-sm transition-colors hover:bg-gray-100/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-1 flex-col gap-1">
                          <p className="leading-snug text-gray-600">{n.message}</p>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              unarchiveMutation.mutate({ id: n.id });
                            }}
                            title="Unarchive"
                          >
                            <ArrowUturnUpIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-500 hover:bg-red-100 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate({ id: n.id });
                            }}
                            title="Permanently Delete"
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}
