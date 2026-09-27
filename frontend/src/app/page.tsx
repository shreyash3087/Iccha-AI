import React, { Suspense } from "react";
import type { Metadata } from "next";
import { HomeClient } from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "ICCHA AI — Voice-first AI website generator",
  description:
    "Voice-first AI website generator for Indian merchants.",
};

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a10] flex items-center justify-center text-xs text-slate-400">
          Loading ICCHA AI...
        </div>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
