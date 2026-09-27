-- ============================================================================
-- ICCHA AI: Supabase Database Schema
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Storefronts Table (Holds business profile, styling, and metadata)
create table if not exists public.storefronts (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    user_id uuid references auth.users(id) on delete set null, -- NULL for guest drafts; links when merchant logs in
    shop_name text not null,
    owner_name text,
    category text not null default 'product',                  -- 'product' | 'service' | 'other'
    template_id text not null default 'product-classic',
    primary_color text,
    accent_color text,
    tagline text,
    locality text,
    city text,
    address text,
    phone text,
    whatsapp text,
    custom_domain text unique,                                 -- for custom domains / subdomains
    hours jsonb default '{"days": "Monday - Saturday", "open_time": "09:00 AM", "close_time": "09:00 PM", "closed_days": ["Sunday"]}'::jsonb,
    offers jsonb default '[]'::jsonb,
    rating numeric(3, 2),
    total_reviews integer,
    places_id text,
    verified_via_places boolean default false,
    google_candidates jsonb default '[]'::jsonb,
    wants_google_review_help boolean,
    interview_complete boolean default false,
    approved boolean default false,
    approved_at timestamptz,
    sections jsonb default '[]'::jsonb,
    header_image text,
    is_published boolean default true,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Schema migration helpers (in case table was created previously):
alter table public.storefronts add column if not exists wants_google_review_help boolean;
alter table public.storefronts add column if not exists approved boolean default false;
alter table public.storefronts add column if not exists approved_at timestamptz;
alter table public.storefronts add column if not exists sections jsonb default '[]'::jsonb;
alter table public.storefronts add column if not exists header_image text;

-- 3. Products / Services Catalog Table
create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    storefront_id uuid not null references public.storefronts(id) on delete cascade,
    name text not null,
    price numeric(10, 2),
    unit text,
    item_type text not null default 'product',                  -- 'product' | 'service'
    description text,
    category text,
    image_url text,
    display_order integer default 0,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. High-Performance Lookup Indexes
create index if not exists idx_storefronts_slug on public.storefronts(slug);
create index if not exists idx_storefronts_user_id on public.storefronts(user_id);
create index if not exists idx_storefronts_custom_domain on public.storefronts(custom_domain);
create index if not exists idx_products_storefront_id on public.products(storefront_id);

-- 5. Row Level Security (RLS) Policies
alter table public.storefronts enable row level security;
alter table public.products enable row level security;

-- Public can read all storefronts & products (visitors viewing sites)
create policy "Allow public read published storefronts"
    on public.storefronts for select
    using (true);

create policy "Allow public read products"
    on public.products for select
    using (true);

-- Allow anonymous creation & updates for voice builder & live edits
create policy "Allow public insert storefronts"
    on public.storefronts for insert
    with check (true);

create policy "Allow public update storefronts"
    on public.storefronts for update
    using (true);

create policy "Allow public insert products"
    on public.products for insert
    with check (true);

create policy "Allow public update products"
    on public.products for update
    using (true);

create policy "Allow public delete products"
    on public.products for delete
    using (true);
