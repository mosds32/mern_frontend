"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useState,
  useRef,
  useEffect,
  Suspense,
  FormEvent,
  KeyboardEvent,
  ClipboardEvent,
} from "react";
import { api, ApiError } from "@/lib/api";
import { decodeJwt } from "@/lib/jwt";

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

interface VerifyOtpResponseData {
  // Backend returns the (new) accessToken as `data` on success
  // e.g. ApiResponse(200, "OtpVerify : User Email Verified", accessToken)
}

function OtpVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const name = searchParams.get("name") ?? "";
  const nextPath =
    searchParams.get("next") ?? "/views/dashboard/patient";
  const otpEndpoint = searchParams.get("endpoint") ?? "/auth/verifyotp";
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState<number>(RESEND_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError(null);

    if (digit && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("");
    if (pasted.length === 0) return;

    const next = Array(OTP_LENGTH).fill("");
    pasted.forEach((digit, i) => (next[i] = digit));
    setOtp(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const otpcode = parseInt(otp.join(""), 10);

    if (otp.some((d) => d === "") || Number.isNaN(otpcode)) {
      setError("Please enter the complete code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<VerifyOtpResponseData>(
        otpEndpoint,
        { otpcode }
      );

      // Backend returns the (fresh, verified) accessToken as `data` on the
      // /auth/verifyotp path. /auth/confirm-otp (forget-password flow) may
      // not return a new token — in that case we simply keep the token that
      // /auth/forget-password already stored, since change-password will use it.
      if (typeof window !== "undefined" && response.data) {
        const maybeToken = response.data as unknown;
        if (typeof maybeToken === "string" && maybeToken.length > 0) {
          localStorage.setItem("token", maybeToken);

          // Pull user info straight from the JWT payload. Different possible
          // claim names are tried since we don't control generateToken()'s
          // exact payload shape; signup form query params are the last resort.
          const decoded = decodeJwt(maybeToken);
          const resolvedName =
            (decoded?.user_name as string | undefined) ??
            (decoded?.name as string | undefined) ??
            (decoded?.fullname as string | undefined) ??
            name;
          const resolvedEmail =
            (decoded?.user_email as string | undefined) ??
            (decoded?.email as string | undefined) ??
            email;

          localStorage.setItem(
            "user",
            JSON.stringify({ user_name: resolvedName, user_email: resolvedEmail })
          );
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(nextPath);
      }, 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        // 402/401 -> wrong otp, 404 -> user not found, 400 -> missing fields
        setError(err.message);
      } else {
        setError("Unable to reach the server. Please try again.");
      }
      // Clear the boxes on a wrong code so the user can retype cleanly
      setOtp(Array(OTP_LENGTH).fill(""));
      focusInput(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    // Temporarily disabled while we isolate the verify-otp/confirm-otp
    // 401 issue — resend was calling a separate endpoint that may need
    // its own auth setup. Re-enable once the main verify flow is confirmed working.
    if (secondsLeft > 0) return;
    setError("Resend is temporarily unavailable. Please use the code already sent.");
  };

  const isComplete = otp.every((d) => d !== "");

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
              ALMOST THERE
            </h1>
            <p className="text-[13px] font-bold tracking-wider mb-4 text-blue-100">
              VERIFY IT&apos;S YOU
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
            Enter verification code
          </h2>
          <p className="text-[13px] text-slate-400 mb-6 leading-relaxed">
            We sent a {OTP_LENGTH}-digit code to{" "}
            <span className="font-semibold text-slate-600">your email</span>.
            Enter it below to continue.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-[13px] text-green-600">
              Verified! Redirecting you...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between gap-2 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isSubmitting}
                  className="w-12 h-14 text-center text-xl font-bold text-slate-900 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:border-[#2f7ff0] focus:ring-2 focus:ring-[#2f7ff0]/20 transition-all disabled:opacity-60"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={!isComplete || isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#12326b] text-white text-sm font-bold cursor-pointer transition-colors hover:bg-[#0d2652] disabled:opacity-40 disabled:cursor-not-allowed mb-5"
            >
              {isSubmitting ? "Verifying..." : "Verify code"}
            </button>
          </form>

          <p className="text-center text-[13px] text-slate-400">
            Didn&apos;t receive the code?{" "}
            {secondsLeft > 0 ? (
              <span className="text-slate-300 font-medium">
                Resend in {secondsLeft}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-blue-500 font-bold hover:underline"
              >
                Resend
              </button>
            )}
          </p>

          <p className="text-center text-[13px] text-slate-400 mt-3">
            <a
              href="/views/authentication/login"
              className="text-blue-500 font-bold hover:underline"
            >
              Back to sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OtpVerification() {
  return (
    <Suspense fallback={null}>
      <OtpVerificationForm />
    </Suspense>
  );
}