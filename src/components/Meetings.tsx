"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Plus, Search, Calendar, ExternalLink, Pencil } from "lucide-react";
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
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  // const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const createMeetingMutation = api.meeting.createMeeting.useMutation({
    onSuccess: () => {
      // api.meeting.getAll.invalidate();
      toast.success("Meeting created successfully");
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to create meeting");
    },
  });

  // useEffect(() => {
  //   try {
  //     const raw = localStorage.getItem(STORAGE_KEY);
  //     if (raw) setMeetings(JSON.parse(raw));
  //     else setMeetings(sampleMeetings());
  //   } catch (e) {
  //     setMeetings(sampleMeetings());
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  const handleSave = async (data: any) => {
    createMeetingMutation.mutate({
      title: data.title,
      description: data.description,
      startTime: data.date,
      link: data.meetLink || "",
      status: data.status,
    });
  };

  const filteredMeetings = meetings
    .filter(
      (meeting) =>
        meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (meeting.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // if (loading) {
  //   return <div className="py-12 text-center">Loading...</div>;
  // }

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
                const meetingDate = new Date(meeting.date);
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
                      {meeting.meetLink && (
                        <Link
                          href={meeting.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex cursor-pointer items-center gap-1 text-sm text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Join Google Meet
                          <ExternalLink className="h-3 w-3" />
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
