import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { MeetingDetailView } from "~/components/MeetingDetailView";

export default async function MeetingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    notFound();
  }

  let meetingData;
  try {
    meetingData = await api.meeting.getMeetingByID({ id: parsedId });
  } catch {
    notFound();
  }

  return (
    <div className="py-6">
      <MeetingDetailView meeting={meetingData} />
    </div>
  );
}
