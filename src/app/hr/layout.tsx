import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { HRLayout } from "~/components/HRLayout";

export default async function HRLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) return redirect("/");

  if (session.user.role?.name !== "HR") {
    return redirect("/dash");
  }

  return (
    <HRLayout
      userName={session.user.name ?? "User"}
      userRole={session.user.role?.name ?? "HR"}
    >
      {children}
    </HRLayout>
  );
}
