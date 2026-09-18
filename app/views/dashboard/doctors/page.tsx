"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  rating: number;
  reviews: number;
  experienceYears: number;
  nextAvailable: string;
  avatarInitials: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: "🏠", active: false, href: "/views/dashboard/patient" },
  { label: "Appointments", icon: "📅", active: false, href: "/views/dashboard/appointments" },
  { label: "Doctors", icon: "🩺", active: true, href: "/views/dashboard/doctors" },
  { label: "Messages", icon: "📄", active: false, href: "/views/dashboard/messages" },
  { label: "Profile", icon: "👤", active: false, href: "/views/dashboard/profile" },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
      <span>★</span>
      <span>{rating.toFixed(1)}</span>
    </span>
  );
}

function formatNextAvailable(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function mapDoctor(doc: DoctorApiResponse): Doctor {
  return {
    id: String(doc.doctors_id),
    name: doc.doctors_full_name,
    specialty: doc.speciality?.speciality_type || "Unknown",
    rating: doc.doctors_rating,
    reviews: doc.doctors_review_count,
    experienceYears: doc.doctors_years_experience,
    nextAvailable: doc.doctors_next_available_at
      ? formatNextAvailable(doc.doctors_next_available_at)
      : "Not available",
    avatarInitials: doc.doctors_intials,
  };
}

export default function DoctorsPage() {
  const router = useRouter();
  const [specialty, setSpecialty] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDoctors() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<DoctorApiResponse[]>("/doctors/get-doctors");
        if (isMounted) {
          setDoctors(res.data.map(mapDoctor));
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load doctors"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDoctors();
    return () => {
      isMounted = false;
    };
  }, []);

  const specialties = ["All", ...Array.from(new Set(doctors.map((d) => d.specialty)))];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpecialty = specialty === "All" || doc.specialty === specialty;
    const matchesQuery =
      query.trim() === "" ||
      doc.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      doc.specialty.toLowerCase().includes(query.trim().toLowerCase());
    return matchesSpecialty && matchesQuery;
  });

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Find a doctor
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Browse specialists and book your next visit.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or specialty"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2f7ff0]/40 focus:border-[#2f7ff0]"
            />
          </div>
        </div>

        {/* Specialty filters */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {specialties.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-full transition-colors ${
                specialty === s
                  ? "bg-[#12326b] text-white"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Loading / error states */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-10 text-center text-sm text-slate-400">
            Loading doctors...
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-200 px-6 py-10 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Doctor cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 hover:border-[#2f7ff0]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#2f7ff0] to-[#0a2a63] text-white flex items-center justify-center text-sm font-bold">
                    {doc.avatarInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-slate-400">{doc.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <RatingStars rating={doc.rating} />
                  <span>{doc.reviews} reviews</span>
                  <span>{doc.experienceYears} yrs exp</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[11px] text-slate-400">Next available</p>
                    <p className="text-xs font-medium text-slate-700">
                      {doc.nextAvailable}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/views/dashboard/book-appointment?doctorId=${doc.id}`
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-[#12326b] text-white text-xs font-bold hover:bg-[#0d2652] transition-colors"
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}

            {filteredDoctors.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 px-6 py-10 text-center text-sm text-slate-400">
                No doctors match your search.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}