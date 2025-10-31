import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import ChangePassword from "~/app/_components/change_password_page";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }
  return <ChangePassword />;
}
