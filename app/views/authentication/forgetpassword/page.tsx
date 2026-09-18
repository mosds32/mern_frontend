"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

interface ForgetPasswordResponseData {
  accessToken?: string;
  access_token?: string;
  token?: string;
  data?: {
    accessToken?: string;
    access_token?: string;
    token?: string;
  };
}

export default function ForgetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<ForgetPasswordResponseData>(
        "/auth/forget-password",
        { email: email.trim().toLowerCase() }
      );

      // The reset flow needs the temporary token before opening the OTP page.
      const responseData = response.data as
        | ForgetPasswordResponseData
        | string
        | null
        | undefined;
      const resetToken =
        typeof responseData === "string"
          ? responseData
          : responseData?.accessToken ??
            responseData?.access_token ??
            responseData?.token ??
            responseData?.data?.accessToken ??
            responseData?.data?.access_token ??
            responseData?.data?.token;

      if (resetToken && typeof window !== "undefined") {
        localStorage.setItem("token", resetToken);
      }

      const params = new URLSearchParams({
        email: email.trim().toLowerCase(),
        // Tells the OTP page where to go after a successful verify,
        // and which backend endpoint confirms this flow's OTP.
        next: "/views/authentication/changepassword",
        endpoint: "/auth/confirm-otp",
      });
      router.push(`/views/authentication/otp?${params.toString()}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to reach the server. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2f66] via-[#1e5fd9] to-[#2f7ff0] p-6">
      <div className="flex w-full max-w-4xl min-h-[480px] rounded-3xl overflow-hidden shadow-2xl bg-white">
        {/* Left decorative panel */}
        <div className="relative flex-1 basis-[45%] bg-gradient-to-br from-[#0a2a63] via-[#1c56c9] to-[#3a8bf5] px-12 py-14 overflow-hidden flex-col justify-center text-white hidden sm:flex">
          <span className="absolute rounded-full w-[340px] h-[340px] -left-36 -bottom-36 bg-[radial-gradient(circle_at_30%_30%,#4c94ff,#0b3aa0)] z-[1]" />
          <span className="absolute rounded-full w-[190px] h-[190px] left-32 -bottom-16 opacity-90 bg-[radial-gradient(circle_at_30%_30%,#4c94ff,#0b3aa0)] z-[1]" />
          <span className="absolute rounded-full w-[90px] h-[90px] -right-5 bottom-8 opacity-60 bg-[radial-gradient(circle_at_30%_30%,#4c94ff,#0b3aa0)] z-0" />

          <div className="relative z-[2] max-w-[280px]">
            <h1 className="text-3xl font-extrabold tracking-wide mb-2">
              RELAX
            </h1>
            <p className="text-[13px] font-bold tracking-wider mb-4 text-blue-100">
              WE&apos;VE GOT YOU COVERED
            </p>
            <p className="text-[13px] leading-relaxed text-white/75">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Suspendisse nibh euismod tincidunt ut laoreet magna aliquam
              erat volutpat.
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 basis-full sm:basis-[55%] bg-white px-8 sm:px-14 py-14 flex flex-col justify-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1.5">
            Forgot password?
          </h2>
          <p className="text-[13px] text-slate-400 mb-7">
            No worries, enter your email and we&apos;ll send you a code
            to reset it.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-3 mb-6 bg-slate-50/50">
              <span className="text-slate-400 shrink-0">✉️</span>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                className="border-none outline-none bg-transparent flex-1 text-sm text-slate-900 placeholder:text-slate-300 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#12326b] text-white text-sm font-bold cursor-pointer transition-colors hover:bg-[#0d2652] mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send reset code"}
            </button>
          </form>

          <p className="text-center text-[13px] text-slate-400">
            Remember your password?{" "}
            <a
              href="/views/authentication/login"
              className="text-blue-500 font-bold hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}