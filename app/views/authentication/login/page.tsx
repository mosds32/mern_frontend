"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
        is_social: 0,
      });

      const responseData = res.data as typeof res.data & {
        token?: string;
        accessToken?: string;
        accesstoken?: string;
      };
      const token =
        responseData.token ??
        responseData.accessToken ??
        responseData.accesstoken;

      if (!token) {
        throw new Error("Login response did not include an access token.");
      }

      const user = { ...res.data };
      delete user.token;
      delete user.accessToken;
      delete user.accesstoken;
      delete user.user_password;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      router.push("/views/dashboard/patient");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
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
              WELCOME
            </h1>
            <p className="text-[13px] font-bold tracking-wider mb-4 text-blue-100">
              YOUR HEADLINE NAME
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
            Sign in
          </h2>
          <p className="text-[13px] text-slate-400 mb-7">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>

          {error && (
            <p className="text-red-500 text-[13px] mb-4 -mt-2">{error}</p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-3 mb-4 bg-slate-50/50">
              <span className="text-slate-400 shrink-0">👤</span>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-none outline-none bg-transparent flex-1 text-sm text-slate-900 placeholder:text-slate-300"
              />
            </div>

            <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-3 mb-4 bg-slate-50/50">
              <span className="text-slate-400 shrink-0">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

            <div className="flex items-center justify-between mb-6 text-[13px]">
              <label className="flex items-center gap-2 text-slate-500">
                <input type="checkbox" className="accent-blue-600" />
                Remember me
              </label>
              <a href="/views/authentication/forgetpassword" className="text-blue-500 font-medium hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#12326b] text-white text-sm font-bold cursor-pointer transition-colors hover:bg-[#0d2652] mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-300 mb-4 before:content-[''] before:flex-1 before:h-px before:bg-slate-200 after:content-[''] after:flex-1 after:h-px after:bg-slate-200">
              or
            </div>
          </form>

          <p className="text-center text-[13px] text-slate-400">
            Don&apos;t have an account?{" "}
            <a href="/views/authentication/signup" className="text-blue-500 font-bold hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}