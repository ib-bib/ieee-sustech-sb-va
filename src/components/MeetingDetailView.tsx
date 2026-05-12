"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Users,
  Clock,
  BarChart3,
  RefreshCw,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface Meeting {
  id: number;
  title: string | null;
  description: string | null;
  meetingCode: string | null;
  status: string | null;
  startTime: Date | null;
  endedAt: Date | null;
  createdAt: Date | null;
}

interface MeetingDetailViewProps {
  meeting: Meeting;
}

export function MeetingDetailView({ meeting }: MeetingDetailViewProps) {
  const [reportEnabled, setReportEnabled] = useState(false);

  const reportQuery = api.meeting.getAttendanceReport.useQuery(
    { meetingCode: meeting.meetingCode ?? "" },
    {
      enabled: reportEnabled && !!meeting.meetingCode,
      retry: false,
    },
  );

  const meetingUrl = meeting.meetingCode
    ? `https://meet.google.com/${meeting.meetingCode}`
    : null;

  const startTime = meeting.startTime ? new Date(meeting.startTime) : null;
  const endedAt = meeting.endedAt ? new Date(meeting.endedAt) : null;

  const statusConfig: Record<
    string,
    { label: string; className: string }
  > = {
    scheduled: {
      label: "Scheduled",
      className: "bg-blue-100 text-blue-700 border border-blue-200",
    },
    started: {
      label: "In Progress",
      className: "bg-green-100 text-green-700 border border-green-200",
    },
    ended: {
      label: "Ended",
      className: "bg-gray-100 text-gray-600 border border-gray-200",
    },
  };
  const statusDisplay =
    statusConfig[meeting.status ?? ""] ?? statusConfig.scheduled;

  function handleFetchReport() {
    if (!meeting.meetingCode) {
      toast.error("This meeting has no meeting code.");
      return;
    }
    if (reportEnabled) {
      void reportQuery.refetch();
    } else {
      setReportEnabled(true);
    }
    toast.info("Fetching attendance report from Google Meet...");
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/hr/meetings"
          className="mb-4 inline-flex cursor-pointer items-center text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Meetings
        </Link>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {meeting.title ?? "Untitled Meeting"}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusDisplay?.className}`}
              >
                {statusDisplay?.label}
              </span>
            </div>
            {startTime && (
              <p className="mt-1 text-gray-500">
                {startTime.toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at{" "}
                {startTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          {meeting.status === "ended" && meeting.meetingCode && (
            <Button
              variant="outline"
              onClick={handleFetchReport}
              disabled={reportQuery.isFetching}
              className="shrink-0 gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${reportQuery.isFetching ? "animate-spin" : ""}`}
              />
              {reportQuery.isFetching
                ? "Fetching..."
                : reportEnabled
                  ? "Refresh Report"
                  : "Fetch Attendance Report"}
            </Button>
          )}
        </div>
      </div>

      {/* Meeting Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {meeting.description && (
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{meeting.description}</p>
              </div>
            )}

            {meeting.meetingCode && (
              <div>
                <p className="text-sm text-gray-500">Meeting Code</p>
                <p className="font-mono font-medium">{meeting.meetingCode}</p>
              </div>
            )}

            {startTime && (
              <div>
                <p className="text-sm text-gray-500">Start Time</p>
                <p className="font-medium">{startTime.toLocaleString()}</p>
              </div>
            )}

            {endedAt && (
              <div>
                <p className="text-sm text-gray-500">Ended At</p>
                <p className="font-medium">{endedAt.toLocaleString()}</p>
              </div>
            )}

            {meeting.createdAt && (
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">
                  {new Date(meeting.createdAt).toLocaleString()}
                </p>
              </div>
            )}

            {meetingUrl && (
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">Google Meet Link</p>
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1 text-blue-600 hover:underline"
                >
                  {meetingUrl}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Report Section */}
      {reportEnabled && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <CardTitle>Attendance Report</CardTitle>
          </CardHeader>
          <CardContent>
            {reportQuery.isFetching && (
              <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                <span>Retrieving data from Google Meet API…</span>
              </div>
            )}

            {reportQuery.isError && !reportQuery.isFetching && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="font-medium text-red-700">
                  Failed to fetch attendance data
                </p>
                <p className="max-w-md text-sm text-gray-500">
                  {reportQuery.error.message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void reportQuery.refetch()}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}

            {reportQuery.data && !reportQuery.isFetching && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      Participants
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {reportQuery.data.participants.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      Meeting Duration
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {reportQuery.data.totalDuration}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:col-span-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BarChart3 className="h-4 w-4" />
                      Avg. Attendance
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {reportQuery.data.participants.length > 0
                        ? (
                          reportQuery.data.participants.reduce(
                            (sum, p) => sum + p.percentage,
                            0,
                          ) / reportQuery.data.participants.length
                        ).toFixed(1)
                        : "0"}
                      %
                    </p>
                  </div>
                </div>

                {/* Participants Table */}
                {reportQuery.data.participants.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    No participants found for this meeting.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                          <th className="pb-3 pr-4 font-medium">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              Email Address
                            </span>
                          </th>
                          <th className="pb-3 pr-4 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Duration
                            </span>
                          </th>
                          <th className="pb-3 pr-4 font-medium">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3.5 w-3.5" />
                              % of Meeting
                            </span>
                          </th>
                          <th className="pb-3 font-medium">Sessions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportQuery.data.participants.map((p, i) => {
                          const attendancePct = p.percentage;
                          const isGoodAttendance = attendancePct >= 75;

                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="py-3 pr-4">
                                <div>
                                  {p.email ? (
                                    <span className="font-mono text-gray-800">
                                      {p.email}
                                    </span>
                                  ) : (
                                    <span className="italic text-gray-400">
                                      {p.displayName} (email unavailable)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 pr-4 font-medium text-gray-700">
                                {p.duration}
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                                    <div
                                      className={`h-full rounded-full ${isGoodAttendance ? "bg-green-500" : "bg-yellow-400"}`}
                                      style={{
                                        width: `${Math.min(attendancePct, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs font-semibold ${isGoodAttendance ? "text-green-700" : "text-yellow-700"}`}
                                  >
                                    {attendancePct}%
                                  </span>
                                  {isGoodAttendance ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  )}
                                </div>
                              </td>
                              <td className="py-3 text-gray-500">
                                {p.sessionCount}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  * Email addresses are sourced from signed-in Google Meet
                  participants. Anonymous or personal-account users may show
                  "email unavailable".
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prompt to fetch if meeting ended but report not yet requested */}
      {!reportEnabled && meeting.status === "ended" && meeting.meetingCode && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 py-10 text-center">
          <Users className="h-8 w-8 text-gray-400" />
          <p className="font-medium text-gray-600">Attendance Report</p>
          <p className="max-w-sm text-sm text-gray-400">
            Click &ldquo;Fetch Attendance Report&rdquo; to retrieve participation
            data from Google Meet.
          </p>
          <Button onClick={handleFetchReport} variant="outline" className="mt-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Fetch Attendance Report
          </Button>
        </div>
      )}

      {/* If the meeting hasn't ended */}
      {meeting.status !== "ended" && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Attendance reports are only available after the meeting has ended and
          Google Meet has processed the data (~10 minutes).
        </div>
      )}
    </div>
  );
}
