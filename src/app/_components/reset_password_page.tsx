"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import WhiteSpinner from "~/app/_components/white_spinner";
import { api } from "~/trpc/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [password1Showing, setPassword1Showing] = useState(false);
  const [password2Showing, setPassword2Showing] = useState(false);
  const [loading, setLoading] = useState(false);
  const resetPasswordMutation = api.user.resetPassword.useMutation();

  const handleResetPassword = async () => {
    if (newPassword !== confirmedPassword) {
      toast.error("Please make sure both password fields match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const loadingToastId = toast.loading("Updating your password...");

    try {
      await resetPasswordMutation.mutateAsync({
        newPassword,
      });
      toast.dismiss(loadingToastId);
      toast.success("Password updated successfully. Signing in...");
      router.push("/dash");
    } catch {
      toast.dismiss(loadingToastId);
      toast.error("Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex w-96 flex-col items-center justify-between gap-4 rounded-2xl py-4 shadow-2xl backdrop-blur-xs">
        <div className="py-4 text-center text-lg font-bold">
          Reset Your Password
        </div>
        <div className="flex w-full flex-col gap-4 px-6">
          <div>
            <label htmlFor="newPassword">New Password</label>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-300 p-3">
              <input
                name="newPassword"
                className="w-full outline-none"
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
                  <EyeIcon className="size-5" />
                ) : (
                  <EyeSlashIcon className="size-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-300 p-3">
              <input
                name="confirmPassword"
                className="w-full outline-none"
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
                  <EyeIcon className="size-5" />
                ) : (
                  <EyeSlashIcon className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        <Button
          onClick={handleResetPassword}
          disabled={loading || !newPassword || !confirmedPassword}
          className="flex h-14 w-50 items-center justify-center gap-2 rounded-2xl bg-[#00B5E2] p-2 text-neutral-50 transition-all hover:bg-[#00629B] active:bg-[#002855] disabled:bg-[#002855]"
          type="button"
        >
          {loading && <WhiteSpinner />}
          {!loading && "Reset Password"}
        </Button>
      </div>
    </main>
  );
}
