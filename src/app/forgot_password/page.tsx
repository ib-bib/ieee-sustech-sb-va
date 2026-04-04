"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const { data, refetch } = api.user.sendForgotPasswordOTP.useQuery({ email });
  // query because we want to know whether to update the UI or not

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      Forgot Password Page
      <div>
        <input
          placeholder="Enter email address"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
        <button
          onClick={() => {
            // create an OTP
            // once an OTP has been generated, redirect user to enter OTP
            // send OTP to email
            refetch();
            console.log(data);
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
