"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import WhiteSpinner from "~/app/_components/white_spinner";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);
  const sendOtpMutation = api.user.sendForgotPasswordOTP.useMutation();

  const handleSendOtp = async () => {
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Sending OTP to your email...");

    try {
      const result = await sendOtpMutation.mutateAsync({ email });
      toast.dismiss(toastId);

      if (result.error) {
        toast.error(
          typeof result.message === "string"
            ? result.message
            : "Unable to send OTP. Please try again.",
        );
        return;
      }

      toast.success("OTP sent. Check your email and enter the code below.");
      setStep("verify");
    } catch {
      toast.dismiss(toastId);
      toast.error("Unable to send OTP. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the OTP code.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Verifying your OTP...");

    try {
      const response = await signIn("otp-credentials", {
        redirect: false,
        email,
        otp,
      });
      toast.dismiss(toastId);

      if (!response?.ok) {
        toast.error("Invalid or expired OTP.");
        return;
      }

      toast.success("OTP verified. Redirecting to reset password...");
      router.push("/reset_password");
    } catch {
      toast.dismiss(toastId);
      toast.error("Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex w-96 flex-col items-center justify-between gap-4 rounded-2xl py-4 shadow-2xl backdrop-blur-xs">
        <div className="py-4 text-center text-lg font-bold">
          Forgot Password
        </div>
        <div className="flex w-full flex-col gap-4 px-6">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            />
          </div>

          {step === "verify" && (
            <div>
              <label htmlFor="otp">OTP Code</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the 6-digit code"
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
              />
            </div>
          )}
        </div>

        <Button
          onClick={step === "request" ? handleSendOtp : handleVerifyOtp}
          disabled={loading || !email || (step === "verify" && !otp)}
          className="flex h-14 w-64 items-center justify-center gap-2 rounded-2xl bg-[#00629B] p-2 text-neutral-50 transition-all hover:bg-[#00629B] active:scale-90 active:bg-[#004D7A] disabled:bg-[#B3E5F2]"
          type="button"
        >
          {loading && <WhiteSpinner />}
          {!loading && (step === "request" ? "Send OTP" : "Verify OTP")}
        </Button>

        {step === "verify" && (
          <Button
            type="button"
            onClick={handleSendOtp}
            className="text-sm text-[#00629B] underline"
          >
            Resend OTP
          </Button>
        )}
      </div>
    </main>
  );
}
