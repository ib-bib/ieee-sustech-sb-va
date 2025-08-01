import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import LoginPage from "~/app/_components/login-page";

export default async function Page() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return <LoginPage />;
}
