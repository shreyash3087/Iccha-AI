import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefrontBySlug } from "@/lib/db/storefronts";
import { StorefrontView } from "@/components/StorefrontView";

interface TempPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TempPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getStorefrontBySlug(slug);

  if (!profile) {
    return { title: "Storefront | ICCHA AI" };
  }

  const title = `${profile.shop_name} · Official Storefront | ICCHA AI`;
  const description =
    profile.tagline ||
    `${profile.shop_name} (${profile.locality || "India"}) — Live menu, WhatsApp ordering & store hours.`;

  return {
    title,
    description,
    icons: { icon: "/logo.png" },
    openGraph: { title, description, type: "website", images: [{ url: profile.header_image || "/logo.png" }] },
    twitter: { card: "summary_large_image", title, description, images: [profile.header_image || "/logo.png"] },
  };
}

export default async function TempWebsitePage({ params }: TempPageProps) {
  const { slug } = await params;
  const profile = await getStorefrontBySlug(slug);

  if (!profile) {
    notFound();
  }

  return <StorefrontView profile={profile} slug={slug} />;
}
