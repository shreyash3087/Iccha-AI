"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import type { BusinessProfile } from "@/types/business";

interface CounterQRModalProps {
  profile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function CounterQRModal({ profile, isOpen, onClose }: CounterQRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Use window.location.href or constructed live URL
    const liveUrl = typeof window !== "undefined" ? window.location.href : `https://iccha.ai/temp/${profile.temp_slug || "preview"}`;

    QRCode.toDataURL(liveUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Generation error", err));
  }, [isOpen, profile.temp_slug]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white text-slate-900 rounded-3xl max-w-[440px] w-full p-6 shadow-2xl relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">दुकान काउंटर QR कोड</h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">इसे प्रिंट करके अपनी दुकान के गल्ले/काउंटर पर लगाएं</p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors border-0"
            aria-label="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Printable Standee Card */}
        <div
          ref={printRef}
          id="printable-standee"
          className="border-3 border-orange-500 rounded-2xl p-6 text-center bg-gradient-to-b from-orange-50/40 via-white to-white shadow-inner"
        >
          {/* Saffron Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 text-xs font-black tracking-wide mb-3 uppercase shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
              <path d="M12 18h.01" />
            </svg>
            SCAN FOR WHATSAPP ORDER
          </div>

          <h2 className="text-2xl font-black text-slate-900 leading-tight mb-1">
            {profile.shop_name}
          </h2>

          <p className="text-xs text-slate-600 mb-3 flex items-center justify-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {profile.address || profile.locality || "स्थानीय बाज़ार"}
          </p>

          {profile.rating && (
            <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold mb-3.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Google Rating: {profile.rating} / 5.0
            </div>
          )}

          {/* QR Code Container */}
          <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-slate-200 inline-block mx-auto shadow-sm">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`QR code for ${profile.shop_name}`}
                className="w-[190px] h-[190px] block"
              />
            ) : (
              <div className="w-[190px] h-[190px] flex items-center justify-center text-xs text-slate-400">
                <span>QR कोड बन रहा है...</span>
              </div>
            )}
          </div>

          <p className="text-xs font-semibold text-slate-700 mt-3 mb-0">
            कैमरे से स्कैन करें और रेट लिस्ट देखें
          </p>

          {profile.whatsapp && (
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>WhatsApp: +91 {profile.whatsapp.replace(/\D/g, "")}</span>
            </div>
          )}

          <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
            Powered by <strong className="text-slate-600">ICCHA AI</strong> (इच्छा AI) · डिजिटल भारत
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 mt-4.5">
          <button
            onClick={handlePrint}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl py-3 px-4 font-bold text-sm cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-all duration-150 border-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect width="12" height="8" x="6" y="14" />
            </svg>
            प्रिंट करें (Print Standee)
          </button>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3 px-4.5 font-semibold text-sm cursor-pointer transition-colors border-0"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
}
