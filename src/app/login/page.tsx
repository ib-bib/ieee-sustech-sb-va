import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import LoginPage from "~/app/_components/login_page";

export default async function Login() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return <LoginPage />;
}
