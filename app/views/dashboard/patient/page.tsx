"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type AppointmentStatus = "upcoming" | "completed" | "cancelled";

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  avatarInitials: string;
}

interface StoredUser {
  user_name?: string;
  user_email?: string;
  [key: string]: unknown;
}

// ── API response shapes ───────────────────────────────────────────────
interface DoctorApiResponse {
  doctors_full_name: string;
  doctors_intials: string;
  speciality?: { speciality_type: string };
}

interface AppointmentApiResponse {
  appointment_id: number;
  appointment_date: string;
  appointment_time: string;
  appointment_reason: string | null;
  appointment_status: string;
  doctors_doctors_id: number;
  doctors: DoctorApiResponse;
}

function mapStatus(status: string): AppointmentStatus {
  const s = status.toLowerCase();
  if (s === "completed") return "completed";
  if (s === "cancelled") return "cancelled";
  return "upcoming"; // Pending / Confirmed -> upcoming
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(timeStr: string) {
  return new Date(timeStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function mapAppointment(a: AppointmentApiResponse): Appointment {
  return {
    id: String(a.appointment_id),
    doctorName: a.doctors?.doctors_full_name || "Unknown Doctor",
    specialty: a.doctors?.speciality?.speciality_type || "General",
    date: formatDate(a.appointment_date),
    time: formatTime(a.appointment_time),
    status: mapStatus(a.appointment_status),
    avatarInitials: a.doctors?.doctors_intials || "??",
  };
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: "🏠", active: true, href: "/views/dashboard/patient" },
  { label: "Appointments", icon: "📅", active: false, href: "/views/dashboard/appointments" },
  { label: "Doctors", icon: "🩺", active: false, href: "/views/dashboard/doctors" },
  { label: "Messages", icon: "📄", active: false, href: "/views/dashboard/messages" },
  { label: "Profile", icon: "👤", active: false, href: "/views/dashboard/profile" },
];

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const styles: Record<AppointmentStatus, string> = {
    upcoming: "bg-blue-50 text-blue-600",
    completed: "bg-emerald-50 text-emerald-600",
    cancelled: "bg-red-50 text-red-500",
  };
  const labels: Record<AppointmentStatus, string> = {
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function PatientDashboard() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [user, setUser] = useState<StoredUser | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchAppointments() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<AppointmentApiResponse[]>(
          "/appointments/get-appointments"
        );
        if (isMounted) {
          const appointmentData = Array.isArray(res.message)
            ? res.message
            : res.data;
          setAppointments(appointmentData.map(mapAppointment));
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load appointments"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAppointments();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/views/authentication/login");
    }
  };

  const displayName = user?.user_name ? user.user_name.split(" ")[0] : "there";

  const upcomingCount = appointments.filter((a) => a.status === "upcoming").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

  const filteredAppointments =
    filter === "all"
      ? appointments
      : appointments.filter((a) => a.status === filter);

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
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-100/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="text-base">🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-6 sm:px-10 py-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Here&apos;s what&apos;s on your schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/views/dashboard/book-appointment")}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#12326b] text-white text-sm font-bold hover:bg-[#0d2652] transition-colors"
          >
            + Book new appointment
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#0a2a63] to-[#2f7ff0] text-white shadow-lg shadow-blue-900/10">
            <p className="text-xs font-semibold text-blue-100 mb-1">
              Upcoming
            </p>
            <p className="text-3xl font-extrabold">{upcomingCount}</p>
          </div>
          <div className="rounded-2xl p-5 bg-white border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 mb-1">
              Completed
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              {completedCount}
            </p>
          </div>
          <div className="rounded-2xl p-5 bg-white border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 mb-1">
              Cancelled
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              {cancelledCount}
            </p>
          </div>
        </div>

        {/* Appointments list */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Your appointments
            </h2>
            <div className="flex gap-1.5">
              {(["all", "upcoming", "completed", "cancelled"] as const).map(
                (key) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors capitalize ${
                      filter === key
                        ? "bg-[#12326b] text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {key}
                  </button>
                )
              )}
            </div>
          </div>

          {loading && (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              Loading appointments...
            </div>
          )}

          {!loading && error && (
            <div className="px-6 py-10 text-center text-sm text-red-500">
              {error}
            </div>
          )}

          {!loading && !error && (
            <ul className="divide-y divide-slate-100">
              {filteredAppointments.map((appt) => (
                <li
                  key={appt.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors"
                >
                  <span className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-[#2f7ff0] to-[#0a2a63] text-white flex items-center justify-center text-sm font-bold">
                    {appt.avatarInitials}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {appt.doctorName}
                    </p>
                    <p className="text-xs text-slate-400">{appt.specialty}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-slate-700">
                      {appt.date}
                    </p>
                    <p className="text-xs text-slate-400">{appt.time}</p>
                  </div>

                  <div className="shrink-0 w-24 text-right">
                    <StatusBadge status={appt.status} />
                  </div>
                </li>
              ))}

              {filteredAppointments.length === 0 && (
                <li className="px-6 py-10 text-center text-sm text-slate-400">
                  No appointments in this category.
                </li>
              )}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}