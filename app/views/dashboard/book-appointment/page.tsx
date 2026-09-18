"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

interface Speciality {
  speciality_id: number;
  speciality_type: string;
}

interface DoctorApiResponse {
  doctors_id: number;
  doctors_full_name: string;
  doctors_intials: string;
  doctors_rating: number;
  doctors_review_count: number;
  doctors_years_experience: number;
  doctors_next_available_at: string;
  doctors_pic_url: string | null;
  doctors_isactive: number;
  speciality: Speciality;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  initials: string;
}

function mapDoctor(doc: DoctorApiResponse): Doctor {
  return {
    id: String(doc.doctors_id),
    name: doc.doctors_full_name,
    specialty: doc.speciality?.speciality_type || "Unknown",
    initials: doc.doctors_intials,
  };
}

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM",
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: "🏠", href: "/views/dashboard/patient" },
  { label: "Appointments", icon: "📅", href: "/views/dashboard/appointments" },
  { label: "Doctors", icon: "🩺", href: "/views/dashboard/doctors" },
  { label: "Messages", icon: "📄", href: "/views/dashboard/messages" },
  { label: "Profile", icon: "👤", href: "/views/dashboard/profile" },
];

// ── Naya: outer component sirf Suspense wrap karta hai ──────────────
export default function BookAppointment() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      }
    >
      <BookAppointmentForm />
    </Suspense>
  );
}

// ── Yeh hissa asal component hai, ab andar hai ───────────────────────
function BookAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDoctorId = searchParams.get("doctorId");

  // ── Doctors from API ──────────────────────────────────────────────
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────────
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(preselectedDoctorId);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");

  // ── Submit state ──────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchDoctors() {
      try {
        setLoadingDoctors(true);
        setDoctorsError(null);
        const res = await api.get<DoctorApiResponse[]>("/doctors/get-doctors");
        if (isMounted) {
          setDoctors(res.data.map(mapDoctor));
        }
      } catch (err) {
        if (isMounted) {
          setDoctorsError(
            err instanceof ApiError ? err.message : "Failed to load doctors"
          );
        }
      } finally {
        if (isMounted) setLoadingDoctors(false);
      }
    }

    fetchDoctors();
    return () => {
      isMounted = false;
    };
  }, []);

  const doctor = doctors.find((d) => d.id === selectedDoctor);
  const canSubmit = Boolean(selectedDoctor && selectedDate && selectedTime && !submitting);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await api.post("/appointments/post-appointment", {
        doctors_doctors_id: Number(selectedDoctor),
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        appointment_reason: reason || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Failed to book appointment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && doctor) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center text-3xl">
              ✅
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
              Appointment requested
            </h1>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Your appointment with{" "}
              <span className="font-semibold text-slate-900">{doctor.name}</span>{" "}
              on{" "}
              <span className="font-semibold text-slate-900">{selectedDate}</span>{" "}
              at{" "}
              <span className="font-semibold text-slate-900">{selectedTime}</span>{" "}
              has been requested. You&apos;ll get a confirmation shortly.
            </p>
            <button
              type="button"
              onClick={() => router.push("/views/dashboard/patient")}
              className="w-full py-3.5 rounded-xl bg-[#12326b] text-white text-sm font-bold cursor-pointer transition-colors hover:bg-[#0d2652]"
            >
              Back to dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />

      <main className="flex-1 px-6 sm:px-10 py-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Book new appointment
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Choose a doctor, pick a time, and you&apos;re set.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Doctor selection */}
          <section>
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              1. Select a doctor
            </h2>

            {loadingDoctors && (
              <div className="text-sm text-slate-400 py-6 text-center bg-white rounded-2xl border border-slate-200">
                Loading doctors...
              </div>
            )}

            {!loadingDoctors && doctorsError && (
              <div className="text-sm text-red-500 py-6 text-center bg-white rounded-2xl border border-red-200">
                {doctorsError}
              </div>
            )}

            {!loadingDoctors && !doctorsError && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((d) => {
                  const isSelected = selectedDoctor === d.id;
                  return (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => {
                        setSelectedDoctor(d.id);
                        setSelectedTime(null);
                      }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-colors ${
                        isSelected
                          ? "border-[#2f7ff0] bg-blue-50/50 ring-1 ring-[#2f7ff0]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-[#2f7ff0] to-[#0a2a63] text-white flex items-center justify-center text-sm font-bold">
                        {d.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {d.name}
                        </p>
                        <p className="text-xs text-slate-400">{d.specialty}</p>
                      </div>
                    </button>
                  );
                })}

                {doctors.length === 0 && (
                  <p className="text-sm text-slate-400 col-span-full text-center py-6">
                    No doctors available.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Step 2: Date */}
          <section>
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              2. Pick a date
            </h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-64 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 bg-white outline-none focus:border-[#2f7ff0] focus:ring-2 focus:ring-[#2f7ff0]/20 transition-all"
            />
          </section>

          {/* Step 3: Time */}
          <section>
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              3. Pick a time
            </h2>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      isSelected
                        ? "bg-[#12326b] text-white border-[#12326b]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 4: Reason */}
          <section>
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              4. Reason for visit{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Briefly describe your symptoms or reason for the visit"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 bg-white outline-none focus:border-[#2f7ff0] focus:ring-2 focus:ring-[#2f7ff0]/20 transition-all resize-none placeholder:text-slate-300"
            />
          </section>

          {submitError && (
            <p className="text-sm text-red-500">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#12326b] text-white text-sm font-bold cursor-pointer transition-colors hover:bg-[#0d2652] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Booking..." : "Confirm appointment"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-gradient-to-b from-[#0a2a63] via-[#123a80] to-[#1c56c9] text-white px-6 py-8">
      <div className="flex items-center gap-2 mb-10">
        <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg">
          ➕
        </span>
        <span className="text-lg font-extrabold tracking-wide">MediCare</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-100/70 hover:bg-white/10 hover:text-white transition-colors"
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
  );
}