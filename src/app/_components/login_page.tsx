"use client";

import {
  CheckIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import WhiteSpinner from "~/app/_components/white_spinner";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShowing, setPasswordShowing] = useState(false);
  const [validUser, setValidUser] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (!res || !res.ok) {
      toast.error(
        res?.error || "Incorrect email or password. Please try again",
      );
      setValidUser(false);
      return;
    }

    setValidUser(true);
    toast.success("Login successful");
    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className="flex h-96 w-96 flex-col items-center justify-between rounded-2xl py-4 shadow-2xl backdrop-blur-xs"
      >
        <Link href="/" className="w-16 sm:w-18 md:w-20 lg:w-22 xl:w-24">
          <Image
            src="/IEEE-Branch-logo-blue-bg_transparent.png"
            alt="IEEE SUSTech Student Branch"
            width={500}
            height={500}
            className="h-auto w-full"
            priority
          />
        </Link>
        <div className="flex flex-col gap-2">
          <div>
            <label htmlFor="email">Email</label>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-300 p-3">
              <EnvelopeIcon className="size-5" />
              <input
                name="email"
                className="outline-none"
                placeholder="name@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <EnvelopeIcon className="invisible size-5" />
            </div>
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-300 p-3">
              <LockClosedIcon className="size-5" />
              <input
                name="password"
                className="outline-none"
                placeholder="Password"
                type={passwordShowing ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                onClick={() => setPasswordShowing(!passwordShowing)}
                type="button"
                className="flex h-6 w-6 items-center justify-center"
              >
                <span className="sr-only">
                  {passwordShowing ? "Hide password" : "Show password"}
                </span>
                {passwordShowing ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        <button
          disabled={loading || !email || !password}
          className="flex h-10 w-30 items-center justify-center gap-1 rounded-2xl bg-[#00B5E2] text-neutral-50 transition-all hover:cursor-pointer hover:bg-[#00629B] active:bg-[#002855] disabled:bg-[#002855]"
          type="submit"
        >
          {loading && <WhiteSpinner />}
          {validUser && !loading && <CheckIcon className="size-5" />}
          {!loading && !validUser && "Log in"}
        </button>
        <div className="flex w-full items-center justify-center py-2">
          <Link
            href="/forgot_password"
            className="underline decoration-[#00629B]"
          >
            Forgot Password ?
          </Link>
        </div>
      </form>
    </main>
  );
}
