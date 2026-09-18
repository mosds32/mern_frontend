"use client";

import { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { isJwtExpired } from "@/lib/jwt";
import { useRouter } from "next/navigation";

interface ProfileForm {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  age: string;
  gender: string;
  address: string;
  bloodGroup: string;
  allergies: string;
  emergencyContact: string;
}

interface ApiUser {
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  user_gender?: string | null;
  user_address?: string | null;
  user_dob?: string | null;
  user_age?: string | number | null;
  user_blood?: string | null;
  user_allergies?: string | null;
  user_emergency?: string | null;
}

const EMPTY_PROFILE: ProfileForm = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  age: "",
  gender: "",
  address: "",
  bloodGroup: "",
  allergies: "",
  emergencyContact: "",
};

const NAV_ITEMS = [
  { label: "Dashboard", icon: "🏠", active: false, href: "/views/dashboard/patient" },
  { label: "Appointments", icon: "📅", active: false, href: "/views/dashboard/appointments" },
  { label: "Doctors", icon: "🩺", active: false, href: "/views/dashboard/doctors" },
  { label: "Messages", icon: "💬", active: false, href: "/views/dashboard/messages" },
  { label: "Profile", icon: "👤", active: true, href: "/views/dashboard/profile" },
];

type TabKey = "personal" | "medical" | "security";

const TABS: { key: TabKey; label: string }[] = [
  { key: "personal", label: "Personal Info" },
  { key: "medical", label: "Medical Info" },
  { key: "security", label: "Security" },
];

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value?: string | null;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2f7ff0]/40 focus:border-[#2f7ff0] disabled:bg-slate-50 disabled:text-slate-400"
      />
    </label>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("personal");
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE);
  const [savedMessage, setSavedMessage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/views/authentication/login");
      return;
    }

    if (isJwtExpired(token)) {
      localStorage.removeItem("token");
      router.push("/views/authentication/login");
      return;
    }

    async function loadProfile() {
      try {
        const response = await api.get<ApiUser[]>("/auth/user");
        const profile = response.data?.[0];

        if (profile) {
          setForm((prev) => ({
            ...prev,
            fullName: String(profile.user_name ?? prev.fullName),
            email: String(profile.user_email ?? prev.email),
            phone: String(profile.user_phone ?? prev.phone),
            gender: String(profile.user_gender ?? prev.gender),
            address: String(profile.user_address ?? prev.address),
            dob: String(profile.user_dob ?? prev.dob),
            age: String(profile.user_age ?? prev.age),
            bloodGroup: String(profile.user_blood ?? prev.bloodGroup),
            allergies: String(profile.user_allergies ?? prev.allergies),
            emergencyContact: String(profile.user_emergency ?? prev.emergencyContact),
          }));
          localStorage.setItem("user", JSON.stringify(profile));
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Unable to load profile data.");
        }
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [router]);

  function update<K extends keyof ProfileForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError("");
    setSaving(true);

    try {
      const payload = {
        name: form.fullName,
        gender: form.gender,
        age: form.age,
        phone: form.phone,
        address: form.address,
        blood: form.bloodGroup,
        allergies: form.allergies,
        emergency: form.emergencyContact,
      };

      const res = await api.post("/auth/update-profile", payload);
      const updated = res.data;

      localStorage.setItem("user", JSON.stringify(updated));

      setForm((prev) => ({
        ...prev,
        fullName: updated.user_name ?? prev.fullName,
        email: updated.user_email ?? prev.email,
        phone: updated.user_phone ?? prev.phone,
        gender: updated.user_gender ?? prev.gender,
        address: updated.user_address ?? prev.address,
        age: updated.user_age ?? prev.age,
        bloodGroup: updated.user_blood ?? prev.bloodGroup,
        allergies: updated.user_allergies ?? prev.allergies,
        emergencyContact: updated.user_emergency ?? prev.emergencyContact,
      }));

      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const initials = form.fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-gradient-to-b from-[#0a2a63] via-[#123a80] to-[#1c56c9] text-white px-6 py-8">
        <div className="flex items-center gap-2 mb-10">
          <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg">
            ➕
          </span>
          <span className="text-lg font-extrabold tracking-wide">
            MediCare
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                item.active
                  ? "bg-white/15 text-white"
                  : "text-blue-100/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <a
            href="/views/authentication/login"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-100/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="text-base">🚪</span>
            Sign out
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-6 sm:px-10 py-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Your profile
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your personal and medical information.
            </p>
          </div>
          {savedMessage && (
            <span className="text-xs font-semibold px-3 py-2 rounded-full bg-emerald-50 text-emerald-600">
              Changes saved
            </span>
          )}
        </div>

        {/* Profile header card */}
        <div className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-[#0a2a63] to-[#2f7ff0] text-white flex items-center gap-5">
          <span className="w-16 h-16 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-xl font-bold">
            {initials}
          </span>
          <div>
            <p className="text-lg font-extrabold">{form.fullName}</p>
            <p className="text-sm text-blue-100">{form.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
                tab === t.key
                  ? "bg-[#12326b] text-white"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          {error && (
            <p className="text-xs text-red-500 font-medium mb-4">{error}</p>
          )}

          {tab === "personal" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Full name" value={form.fullName} onChange={(v) => update("fullName", v)} />
              <Field label="Email" value={form.email} onChange={() => {}} type="email" disabled />
              <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
              <Field label="Age" value={form.age} onChange={(v) => update("age", v)} />
              <Field label="Gender" value={form.gender} onChange={(v) => update("gender", v)} />
              <Field label="Address" value={form.address} onChange={(v) => update("address", v)} />
            </div>
          )}

          {tab === "medical" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Blood group" value={form.bloodGroup} onChange={(v) => update("bloodGroup", v)} />
              <Field label="Allergies" value={form.allergies} onChange={(v) => update("allergies", v)} />
              <Field
                label="Emergency contact"
                value={form.emergencyContact}
                onChange={(v) => update("emergencyContact", v)}
              />
            </div>
          )}

          {tab === "security" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Current password" value="" onChange={() => {}} type="password" />
              <Field label="New password" value="" onChange={() => {}} type="password" />
              <Field label="Confirm new password" value="" onChange={() => {}} type="password" />
            </div>
          )}

          <div className="flex justify-end mt-6 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-3 rounded-xl bg-[#12326b] text-white text-sm font-bold hover:bg-[#0d2652] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}