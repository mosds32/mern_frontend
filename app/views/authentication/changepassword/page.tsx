"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export default function ChangePassword() {
  const router = useRouter();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/change-password", { password });

      // Clear the temporary token issued by the forget-password/OTP step
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }

      router.push("/views/authentication/login");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
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
              NEW START
            </h1>
            <p className="text-[13px] font-bold tracking-wider mb-4 text-blue-100">
              SET A FRESH PASSWORD
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
            Change password
          </h2>
          <p className="text-[13px] text-slate-400 mb-7">
            Your new password must be different from previously used
            passwords.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-3 mb-4 bg-slate-50/50">
              <span className="text-slate-400 shrink-0">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-none outline-none bg-transparent flex-1 text-sm text-slate-900 placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="border-none bg-transparent text-xs font-bold text-blue-500 cursor-pointer tracking-wide"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-3 mb-2 bg-slate-50/50">
              <span className="text-slate-400 shrink-0">🔒</span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="border-none outline-none bg-transparent flex-1 text-sm text-slate-900 placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="border-none bg-transparent text-xs font-bold text-blue-500 cursor-pointer tracking-wide"
              >
                {showConfirmPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium mb-4">
                {error}
              </p>
            )}

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Use at least 8 characters, including a number and a symbol.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#12326b] text-white text-sm font-bold cursor-pointer transition-colors hover:bg-[#0d2652] mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset password"}
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