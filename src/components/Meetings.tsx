"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
  Plus,
  Search,
  Calendar,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { MeetingDialog } from "./MeetingDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type Meeting = {
  id: number;
  title: string;
  description?: string;
  date: string;
  meetLink?: string;
};

const STORAGE_KEY = "local_meetings_v1";

function sampleMeetings(): Meeting[] {
  const now = new Date();
  const m1 = new Date(now.getTime() + 1000 * 60 * 60 * 24);
  const m2 = new Date(now.getTime() + 1000 * 60 * 60 * 48);
  return [
    {
      id: 1,
      title: "Weekly Team Sync",
      description: "Standup and planning",
      date: m1.toISOString(),
      meetLink: "",
    },
    {
      id: 2,
      title: "Project Planning",
      description: "Roadmap and milestones",
      date: m2.toISOString(),
      meetLink: "",
    },
  ];
}

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMeetings(JSON.parse(raw));
      else setMeetings(sampleMeetings());
    } catch (e) {
      setMeetings(sampleMeetings());
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (items: Meeting[]) => {
    setMeetings(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      /* ignore */
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingMeeting) {
        const updated = meetings.map((m) =>
          m.id === editingMeeting.id ? { ...m, ...data } : m,
        );
        persist(updated);
        toast.success("Meeting updated successfully");
      } else {
        const id = Date.now();
        const created = [{ id, ...data }, ...meetings];
        persist(created);
        toast.success("Meeting created successfully");
      }
      setDialogOpen(false);
      setEditingMeeting(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save meeting");
    }
  };

  const handleDelete = async () => {
    if (!meetingToDelete) return;
    try {
      persist(meetings.filter((m) => m.id !== meetingToDelete.id));
      setDeleteDialogOpen(false);
      setMeetingToDelete(null);
      toast.success("Meeting deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete meeting");
    }
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

  if (loading) {
    return <div className="py-12 text-center">Loading...</div>;
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
          onClick={() => {
            setEditingMeeting(null);
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
                            {meeting.meetLink && (
                              <a
                                href={meeting.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex cursor-pointer items-center gap-1 text-sm text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Join Google Meet
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingMeeting(meeting);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMeetingToDelete(meeting);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
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
        meeting={editingMeeting}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{meetingToDelete?.title}"? This
              will also delete all attendance records. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
