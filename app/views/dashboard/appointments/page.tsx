"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

// ── API response shapes ───────────────────────────────────────────────
interface DoctorApiResponse {
  doctors_full_name: string;
  doctors_intials: string;
  doctors_rating?: number;
  doctors_phone?: string;
  doctors_email?: string;
  speciality?: { speciality_type: string };
}

interface AppointmentApiResponse {
  appointment_id: number;
  appointment_date: string;
  appointment_time: string;
  appointment_reason: string | null;
  appointment_status: string; // "Pending" | "Confirmed" | "Completed" | "Cancelled"
  appointment_createdat: string;
  doctors_doctors_id: number;
  doctors: DoctorApiResponse;
}

// ── UI shape ──────────────────────────────────────────────────────────
type AppointmentStatus = "upcoming" | "completed" | "cancelled";

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  avatarInitials: string;
  location: string;
  doctorPhone: string;
  doctorEmail: string;
  reason: string;
}

// ── Backend status -> UI status ──────────────────────────────────────
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
    location: "MediCare Clinic",
    doctorPhone: a.doctors?.doctors_phone || "Not available",
    doctorEmail: a.doctors?.doctors_email || "Not available",
    reason: a.appointment_reason || "No reason provided",
  };
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: "🏠", href: "/views/dashboard/patient" },
  { label: "Appointments", icon: "📅", href: "/views/dashboard/appointments" },
  { label: "Doctors", icon: "🩺", href: "/views/dashboard/doctors" },
  { label: "Messages", icon: "📄", href: "/views/dashboard/messages" },
  { label: "Profile", icon: "👤", href: "/views/dashboard/profile" },
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
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function AppointmentDetailModal({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#0a2a63] to-[#2f7ff0] text-white px-6 py-6 flex items-center gap-4">
          <span className="w-14 h-14 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-lg font-bold">
            {appointment.avatarInitials}
          </span>
          <div>
            <p className="text-lg font-extrabold">{appointment.doctorName}</p>
            <p className="text-sm text-blue-100">{appointment.specialty}</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Status</span>
            <StatusBadge status={appointment.status} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Date &amp; time</span>
            <span className="text-sm font-medium text-slate-700">
              {appointment.date} · {appointment.time}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Location</span>
            <span className="text-sm font-medium text-slate-700 text-right">
              {appointment.location}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Reason</span>
            <span className="text-sm font-medium text-slate-700 text-right max-w-[60%]">
              {appointment.reason}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Doctor phone</span>
              <span className="text-sm font-medium text-slate-700">
                {appointment.doctorPhone}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Doctor email</span>
              <span className="text-sm font-medium text-slate-700">
                {appointment.doctorEmail}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          {appointment.status === "upcoming" && (
            <button
              type="button"
              className="flex-1 px-4 py-3 rounded-xl bg-[#12326b] text-white text-sm font-bold hover:bg-[#0d2652] transition-colors"
            >
              Reschedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setAppointments(
            appointmentData.map(mapAppointment)
          );
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

  const filteredAppointments = appointments.filter((a) => {
    const matchesFilter = filter === "all" || a.status === filter;
    const matchesSearch = a.doctorName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen flex bg-slate-50">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                item.label === "Appointments"
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

      <main className="flex-1 px-6 sm:px-10 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Appointments</h1>
            <p className="text-sm text-slate-400 mt-1">
              All your appointments, past and upcoming.
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

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor name"
              className="w-full sm:w-64 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50/50 outline-none focus:border-[#2f7ff0] focus:ring-2 focus:ring-[#2f7ff0]/20 transition-all placeholder:text-slate-300"
            />
            <div className="flex gap-1.5">
              {(["all", "upcoming", "completed", "cancelled"] as const).map((key) => (
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
              ))}
            </div>
          </div>

          {loading && (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              Loading appointments...
            </div>
          )}

          {!loading && error && (
            <div className="px-6 py-10 text-center text-sm text-red-500">{error}</div>
          )}

          {!loading && !error && (
            <ul className="divide-y divide-slate-100">
              {filteredAppointments.map((appt) => (
                <li
                  key={appt.id}
                  onClick={() => setSelectedAppointment(appt)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
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
                    <p className="text-sm font-medium text-slate-700">{appt.date}</p>
                    <p className="text-xs text-slate-400">{appt.time}</p>
                  </div>

                  <div className="shrink-0 w-24 text-right">
                    <StatusBadge status={appt.status} />
                  </div>
                </li>
              ))}

              {filteredAppointments.length === 0 && (
                <li className="px-6 py-10 text-center text-sm text-slate-400">
                  No appointments match your search.
                </li>
              )}
            </ul>
          )}
        </div>
      </main>

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}