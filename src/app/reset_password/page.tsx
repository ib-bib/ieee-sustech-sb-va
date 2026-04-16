import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import ResetPassword from "~/app/_components/reset_password_page";

export default async function ResetPasswordPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <ResetPassword />;
}
