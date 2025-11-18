"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import WhiteSpinner from "./white_spinner";
import { toast } from "sonner";
import { api } from "~/trpc/react";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oldPassShowing, setOldPassShowing] = useState(false);
  const [password1Showing, setPassword1Showing] = useState(false);
  const [password2Showing, setPassword2Showing] = useState(false);
  const updatePasswordMutation = api.user.updatePassword.useMutation();

  const handlePasswordUpdate = async () => {
    let toastErrorId;
    if (newPassword != confirmedPassword) {
      toastErrorId = toast.error(
        "Please ensure typing your new password correctly in both fields.",
      );
      return;
    }
    if (newPassword == oldPassword) {
      toastErrorId = toast.error(
        "New password cannot be the same as the previous one.",
      );
      return;
    }
    setLoading(true);
    const loadingToastID = toast.loading("Your password is being updated");

    const updateMutationResult = await updatePasswordMutation.mutateAsync({
      oldPassword,
      newPassword,
      confirmedPassword,
    });

    const username = updateMutationResult.data;

    if (!username) {
      toast.dismiss(loadingToastID);
      toast.error(updateMutationResult.error);
    }

    toast.dismiss(loadingToastID);
    toast.dismiss(toastErrorId);
    toast.success(
      `Your password has been updated, ${username}. You will be signed out momentarily...`,
    );

    await signOut();

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex w-96 flex-col items-center justify-between gap-4 rounded-2xl py-4 shadow-2xl backdrop-blur-xs">
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
        <div className="flex flex-col gap-4">
          <div className="py-4 text-center text-lg font-bold">
            Update Your Password
          </div>
          <div>
            <label htmlFor="oldPassword">Old Password</label>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-300 p-3">
              <LockClosedIcon className="size-5" />
              <input
                name="oldPassword"
                className="outline-none"
                placeholder="Old Password"
                type={oldPassShowing ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <button
                onClick={() => setOldPassShowing(!oldPassShowing)}
                type="button"
                className="flex h-6 w-6 items-center justify-center"
              >
                <span className="sr-only">
                  {oldPassShowing ? "Hide password" : "Show password"}
                </span>
                {oldPassShowing ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="newPassword">Password</label>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-300 p-3">
              <LockClosedIcon className="size-5" />
              <input
                name="newPassword"
                className="outline-none"
                placeholder="New Password"
                type={password1Showing ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                onClick={() => setPassword1Showing(!password1Showing)}
                type="button"
                className="flex h-6 w-6 items-center justify-center"
              >
                <span className="sr-only">
                  {password1Showing ? "Hide password" : "Show password"}
                </span>
                {password1Showing ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm">Confirm Password</label>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-300 p-3">
              <LockClosedIcon className="size-5" />
              <input
                name="confirm"
                className="outline-none"
                placeholder="Confirm Password"
                type={password2Showing ? "text" : "password"}
                value={confirmedPassword}
                onChange={(e) => setConfirmedPassword(e.target.value)}
              />
              <button
                onClick={() => setPassword2Showing(!password2Showing)}
                type="button"
                className="flex h-6 w-6 items-center justify-center"
              >
                <span className="sr-only">
                  {password2Showing ? "Hide password" : "Show password"}
                </span>
                {password2Showing ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handlePasswordUpdate}
          disabled={loading}
          className="flex h-14 w-50 items-center justify-center gap-2 rounded-2xl bg-[#00B5E2] p-2 text-neutral-50 transition-all hover:cursor-pointer hover:bg-[#00629B] active:scale-90 active:bg-[#002855] disabled:bg-[#002855]"
          type="button"
        >
          {loading && <WhiteSpinner />}
          {!loading && "Update Password"}
        </button>
      </div>
    </main>
  );
}
