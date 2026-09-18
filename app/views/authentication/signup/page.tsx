"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

interface SignUpFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface SignUpResponseData {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  token?: string;
  accessToken?: string;
  accesstoken?: string;
}

export default function SignUp() {
  const router = useRouter();

  const [form, setForm] = useState<SignUpFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleChange =
    (field: keyof SignUpFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "agreeToTerms" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side validation before hitting the API
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.agreeToTerms) {
      setError("You must agree to the Terms and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<SignUpResponseData>("/auth/signup", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        // Required by the backend's Joi schema (signupSchema).
        // 0 = normal email/password signup, 1 = social (Google/Facebook) signup.
        is_social: 0,
      });

      // Persist the token if the backend issues one on signup.
      const signupToken =
        response.data?.token ??
        response.data?.accessToken ??
        response.data?.accesstoken;
      if (signupToken && typeof window !== "undefined") {
        localStorage.setItem("token", signupToken);
      }

      setSuccess(true);
      // Redirect to OTP verification screen, passing name + email so that
      // page can show/store the user's name once verification succeeds.
      setTimeout(() => {
        const params = new URLSearchParams({
          email: form.email.trim().toLowerCase(),
          name: form.name.trim(),
          next: "/views/dashboard/patient",
          endpoint: "/auth/verifyotp",
        });
        router.push(`/views/authentication/otp?${params.toString()}`);
      }, 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        // Backend controller returns 402 specifically for "User already exists"
        setError(
          err.statusCode === 402
            ? "An account with this email already exists."
            : err.message
        );
      } else {
        setError("Unable to reach the server. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2f66] via-[#1e5fd9] to-[#2f7ff0] p-6">
      <div className="flex w-full max-w-4xl min-h-[560px] rounded-3xl overflow-hidden shadow-2xl bg-white">
        {/* Left decorative panel */}
        <div className="relative flex-1 basis-[45%] bg-gradient-to-br from-[#0a2a63] via-[#1c56c9] to-[#3a8bf5] px-12 py-14 overflow-hidden flex-col justify-center text-white hidden sm:flex">
          <span className="absolute rounded-full w-[340px] h-[340px] -left-36 -bottom-36 bg-[radial-gradient(circle_at_30%_30%,#4c94ff,#0b3aa0)] z-[1]" />
          <span className="absolute rounded-full w-[190px] h-[190px] left-32 -bottom-16 opacity-90 bg-[radial-gradient(circle_at_30%_30%,#4c94ff,#0b3aa0)] z-[1]" />
          <span className="absolute rounded-full w-[90px] h-[90px] -right-5 bottom-8 opacity-60 bg-[radial-gradient(circle_at_30%_30%,#4c94ff,#0b3aa0)] z-0" />

          <div className="relative z-[2] max-w-[280px]">
            <h1 className="text-3xl font-extrabold tracking-wide mb-2">
              JOIN US
            </h1>
            <p className="text-[13px] font-bold tracking-wider mb-4 text-blue-100">
              CREATE YOUR ACCOUNT
            </p>
            <p className="text-[13px] leading-relaxed text-white/75">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Suspendisse nibh euismod tincidunt ut laoreet magna aliquam
              erat volutpat.
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 basis-full sm:basis-[55%] bg-white px-8 sm:px-14 py-12 flex flex-col justify-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1.5">
            Sign up
          </h2>
          <p className="text-[13px] text-slate-400 mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-[13px] text-green-600">
              Account created! Redirecting you to verify your OTP...
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-3 mb-3.5 bg-slate-50/50">
              <span className="text-slate-400 shrink-0">👤</span>
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange("name")}
                disabled={isSubmitting}
                className="border-none outline-none bg-transparent flex-1 text-sm text-slate-900 placeholder:text-slate-300 disabled:opacity-60"
              />
            </div>

            <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-3 mb-3.5 bg-slate-50/50">
              <span className="text-slate-400 shrink-0">✉️</span>
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange("email")}
                disabled={isSubmitting}
                className="border-none outline-none bg-transparent flex-1 text-sm text-slate-900 placeholder:text-slate-300 disabled:opacity-60"
              />
            </div>

            <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-3 mb-3.5 bg-slate-50/50">
              <span className="text-slate-400 shrink-0">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={handleChange("password")}
                disabled={isSubmitting}
                className="border-none outline-none bg-transparent flex-1 text-sm text-slate-900 placeholder:text-slate-300 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="border-none bg-transparent text-xs font-bold text-blue-500 cursor-pointer tracking-wide"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-3 mb-4 bg-slate-50/50">
              <span className="text-slate-400 shrink-0">🔒</span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                disabled={isSubmitting}
                className="border-none outline-none bg-transparent flex-1 text-sm text-slate-900 placeholder:text-slate-300 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="border-none bg-transparent text-xs font-bold text-blue-500 cursor-pointer tracking-wide"
              >
                {showConfirmPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            <div className="flex items-center mb-6 text-[13px]">
              <label className="flex items-start gap-2 text-slate-500">
                <input
                  type="checkbox"
                  className="accent-blue-600 mt-0.5"
                  checked={form.agreeToTerms}
                  onChange={handleChange("agreeToTerms")}
                  disabled={isSubmitting}
                />
                <span>
                  I agree to the{" "}
                  <a href="#" className="text-blue-500 font-medium hover:underline">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-500 font-medium hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#12326b] text-white text-sm font-bold cursor-pointer transition-colors hover:bg-[#0d2652] disabled:opacity-60 disabled:cursor-not-allowed mb-4"
            >
              {isSubmitting ? "Signing up..." : "Sign up"}
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-300 mb-4 before:content-[''] before:flex-1 before:h-px before:bg-slate-200 after:content-[''] after:flex-1 after:h-px after:bg-slate-200">
              or
            </div>
          </form>

          <p className="text-center text-[13px] text-slate-400">
            Already have an account?{" "}
            <a href="/" className="text-blue-500 font-bold hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}