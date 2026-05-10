import Link from "next/link";
import { api } from "~/trpc/server";

export default async function MeetingDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meetingData = await api.meeting.getMeetingByID({ id: parseInt(id) });

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold">Meeting Details</h1>
      <div className="mt-4">
        <p>
          <strong>Meeting Code:</strong> {meetingData.meetingCode}
        </p>
        <p>
          <strong>Status:</strong> {meetingData.status}
        </p>
        <p>
          <strong>Created At:</strong>{" "}
          {new Date(meetingData.createdAt ?? "").toLocaleString()}
        </p>
        <p>
          <strong>Meeting Description:</strong> {meetingData.description}
        </p>
        <p>
          <strong>Start Time:</strong>{" "}
          {new Date(meetingData.startTime ?? "").toLocaleString()}
        </p>
        <p>
          <strong>Ended At:</strong>{" "}
          {meetingData.endedAt
            ? new Date(meetingData.endedAt).toLocaleString()
            : "N/A"}
        </p>
        <p>
          <strong>Meeting Title: </strong> {meetingData.title}
        </p>
        <p>
          <strong>Meeting Link: </strong>{" "}
          <Link
            href={`https://meeting.google.com/${meetingData.meetingCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 decoration-dashed underline-offset-4 transition hover:text-blue-700 hover:underline active:text-blue-900 active:decoration-solid"
          >
            {`https://meeting.google.com/${meetingData.meetingCode}`}
          </Link>
        </p>
      </div>
    </div>
  );
}
