"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { BusinessProfile } from "@/types/business";
import { useAuth } from "@/context/AuthContext";
import { AppNavbar } from "@/components/AppNavbar";
import { CounterQRModal } from "@/components/CounterQRModal";

export default function DashboardPage() {
  const { user, loading: authLoading, signIn } = useAuth();

  const [sites, setSites] = useState<BusinessProfile[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [selectedQRProfile, setSelectedQRProfile] = useState<BusinessProfile | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "drafts">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const fetchSites = useCallback(async (userId: string) => {
    setSitesLoading(true);
    try {
      const res = await fetch(`/api/storefronts?userId=${userId}`);
      const data = await res.json();
      setSites(data.sites || []);
    } catch {
      setSites([]);
    } finally {
      setSitesLoading(false);
    }
  }, []);

  // Fetch sites whenever user changes
  useEffect(() => {
    if (user?.id) {
      void fetchSites(user.id);
    } else {
      setSites([]);
    }
  }, [user, fetchSites]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setSignInError(null);
    // After login, come back to /dashboard
    await signIn("/dashboard");
    setSigningIn(false);
  };

  const handleApprove = async (slug: string) => {
    setActionLoading(slug);
    try {
      const res = await fetch("/api/storefronts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", slug, userId: user?.id, userEmail: user?.email }),
      });
      const data = await res.json();
      if (data.success) {
        setSites((prev) =>
          prev.map((s) => s.temp_slug === slug ? { ...s, approved: true, approved_at: new Date().toISOString() } : s)
        );
      }
    } catch {/* ignore */} finally {
      setActionLoading(null);
    }
  };

  const approvedCount = sites.filter((s) => s.approved).length;
  const draftCount = sites.filter((s) => !s.approved).length;
  const totalItems = sites.reduce((acc, s) => acc + (s.products?.length || 0), 0);
  const filteredSites = sites.filter((s) => {
    if (filter === "approved") return s.approved;
    if (filter === "drafts") return !s.approved;
    return true;
  });

  // ── Auth loading screen ────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] text-slate-900 font-sans">
      {/* Shared navbar — same on every page */}
      <AppNavbar returnTo="/dashboard" />

      <main className="max-w-6xl mx-auto px-5 py-10 pb-20">

        {/* Create button row */}
        <div className="flex items-center justify-end mb-8">
          <Link href="/"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm transition-all no-underline">
            + Create New Storefront
          </Link>
        </div>

        {/* ── UNAUTHENTICATED ────────────────────────────────────────────── */}
        {!user ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-3xl shadow-lg mx-auto mb-6">
                इ
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Merchant Dashboard</h1>
              <p className="text-sm text-slate-500 leading-relaxed mb-8 max-w-xs mx-auto">Manage your storefronts, edit with voice, and download QR standees.</p>

              <button id="dashboard-google-signin" type="button" onClick={handleGoogleSignIn} disabled={signingIn}
                className="w-full inline-flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-800 rounded-xl py-3.5 px-5 text-sm font-semibold shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer mb-3 disabled:opacity-60">
                {signingIn ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>{signingIn ? "Redirecting to Google..." : "Continue with Google"}</span>
              </button>
              {signInError && <p className="text-xs text-red-500 mt-2">{signInError}</p>}

              <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-slate-100 text-left">
                {[
                  "Direct Google Maps integration",
                  "Private, cloud-synced dashboard",
                  "Print-ready counter QR standees",
                ].map((point, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── AUTHENTICATED ──────────────────────────────────────────────── */
          <div>
            {/* Page header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                  Welcome, {user.name?.split(" ")[0] || "Merchant"}
                </p>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0">Your Storefronts</h1>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <div className="text-xl font-black text-emerald-600">{approvedCount}</div>
                  <div className="text-slate-400 font-medium">Approved</div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <div className="text-xl font-black text-amber-500">{draftCount}</div>
                  <div className="text-slate-400 font-medium">Drafts</div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <div className="text-xl font-black text-slate-700">{totalItems}</div>
                  <div className="text-slate-400 font-medium">Items</div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
              {([
                { key: "all", label: `All (${sites.length})` },
                { key: "approved", label: `Approved (${approvedCount})` },
                { key: "drafts", label: `Drafts (${draftCount})` },
              ] as const).map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setFilter(key)}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer bg-transparent border-t-0 border-x-0 -mb-px ${
                    filter === key ? "border-b-orange-500 text-orange-600" : "border-b-transparent text-slate-400 hover:text-slate-700"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Grid */}
            {sitesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading...</p>
              </div>
            ) : filteredSites.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-white">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mx-auto mb-4">
                  <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
                </svg>
                <h3 className="text-base font-bold text-slate-700 mb-1.5">No storefronts yet</h3>
                <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto">Build your first digital storefront simply by speaking.</p>
                <Link href="/" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-full text-xs font-extrabold no-underline shadow-md">
                  Create First Storefront →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSites.map((site) => {
                  const slug = site.temp_slug || "";
                  const isApproved = Boolean(site.approved);
                  const isProcessing = actionLoading === slug;
                  return (
                    <div key={slug} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
                      {/* Cover */}
                      <div className="h-40 w-full relative bg-slate-100 overflow-hidden">
                        {site.header_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={site.header_image} alt={site.shop_name} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-4xl font-black text-slate-300">{site.shop_name?.charAt(0)?.toUpperCase() || "S"}</div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                        <div className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${isApproved ? "bg-emerald-500 text-white" : "bg-amber-400 text-slate-900"}`}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            {isApproved ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="10" />}
                          </svg>
                          <span>{isApproved ? "Approved" : "Draft"}</span>
                        </div>
                        {site.category && (
                          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/40 text-white uppercase backdrop-blur-sm">{site.category}</div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-4 flex flex-col gap-3 flex-1">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 mb-0.5 leading-tight">{site.shop_name}</h3>
                          {site.tagline && <p className="text-xs text-slate-400 m-0 line-clamp-1">{site.tagline}</p>}
                          {site.locality && <p className="text-[11px] text-slate-400 m-0 mt-0.5">{site.locality}{site.city ? ` · ${site.city}` : ""}</p>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {site.rating && (
                            <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                              {site.rating}
                            </span>
                          )}
                          <span>{site.products?.length || 0} {site.category === "service" ? "services" : "items"}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-100 flex-wrap">
                          <a href={`/temp/${slug}`} target="_blank" rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors no-underline">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Open Storefront
                          </a>
                          <button type="button" onClick={() => setSelectedQRProfile(site)}
                            className="inline-flex items-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" />
                              <rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                              <path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" />
                              <path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" />
                              <path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
                            </svg>
                            QR
                          </button>
                          {!isApproved && (
                            <button type="button" onClick={() => handleApprove(slug)} disabled={isProcessing}
                              className="inline-flex items-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              {isProcessing ? "..." : "Approve"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedQRProfile && (
        <CounterQRModal profile={selectedQRProfile} isOpen={Boolean(selectedQRProfile)} onClose={() => setSelectedQRProfile(null)} />
      )}
    </div>
  );
}
