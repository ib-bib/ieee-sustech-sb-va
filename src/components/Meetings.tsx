"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Plus, Search, Calendar, Pencil } from "lucide-react";
import { MeetingDialog } from "./MeetingDialog";
import { toast } from "sonner";
import { api } from "~/trpc/react";

type Meeting = {
  id: number;
  title: string;
  description?: string;
  date: string;
  meetLink?: string;
};

export default function Meetings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const meetingsQuery = api.meeting.getAll.useQuery();

  const createMeetingMutation = api.meeting.createMeeting.useMutation({
    onSuccess: async () => {
      await meetingsQuery.refetch();
      toast.success("Meeting created successfully");
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to create meeting");
    },
  });

  const handleSave = async (data: any) => {
    const loadingToast = toast.loading("Creating meeting...");

    createMeetingMutation.mutate(
      {
        title: data.title,
        description: data.description,
        startTime: data.date.toISOString(),
        link: data.meetLink,
        status: data.status,
      },
      {
        onSettled: () => toast.dismiss(loadingToast),
      },
    );
  };

  const filteredMeetings = (meetingsQuery.data ?? [])
    .filter((meeting) => {
      // 1. Handle potential null title safely
      const title = meeting.title ?? "Untitled Meeting";
      const description = meeting.description ?? "";
      const searchLower = searchQuery.toLowerCase();

      return (
        title.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // 2. Handle potential null startTime for sorting
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeB - timeA;
    });

  if (meetingsQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Loading meetings...</span>
      </div>
    );
  }

  if (meetingsQuery.isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 text-center">
          <p className="font-medium text-red-800">Failed to load meetings</p>
          <p className="mb-4 text-sm text-red-600">
            {meetingsQuery.error.message}
          </p>
          <Button
            variant="outline"
            onClick={() => void meetingsQuery.refetch()}
            className="border-red-300 hover:bg-red-100"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Meetings
          </h2>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Manage meetings and track attendance
          </p>
        </div>
        <Button
          className="cursor-pointer"
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Meeting
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredMeetings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">
                {searchQuery
                  ? "No meetings found matching your search"
                  : "No meetings yet. Schedule your first meeting!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((meeting) => {
                const meetingDate = meeting.startTime
                  ? new Date(meeting.startTime)
                  : new Date();
                const isPast = meetingDate < new Date();

                return (
                  <div
                    key={meeting.id}
                    className="flex flex-col items-start justify-between gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 sm:flex-row"
                  >
                    <div className="w-full min-w-0 flex-1">
                      <Link
                        href={`/hr/meetings/${meeting.id}`}
                        className="block cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <Calendar
                            className={`mt-0.5 h-5 w-5 shrink-0 ${isPast ? "text-gray-400" : "text-blue-600"}`}
                          />
                          <div className="min-w-0 flex-1">
                            <h3
                              className={`font-semibold ${isPast ? "text-gray-500" : "text-gray-900"} hover:text-blue-600`}
                            >
                              {meeting.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {meetingDate.toLocaleDateString()} at{" "}
                              {meetingDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {meeting.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                {meeting.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                      {meeting.meetingCode && meeting.status != "ended" && (
                        <Link
                          href="{`[https://meet.google.com/$](https://meet.google.com/$){meeting.meetingCode}`}"
                          target="_blank"
                          className="text-blue-600"
                        >
                          Join Meeting
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MeetingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        meeting={""}
      />
    </div>
  );
}
