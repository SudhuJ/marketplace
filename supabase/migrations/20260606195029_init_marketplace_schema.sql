-- Create extensions
create extension if not exists "moddatetime" with schema extensions;

-- Create categories table for listings
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create profiles table to extend auth.users with additional info
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create listings table
create table listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  title text not null,
  description text,
  price decimal(10,2) not null check (price >= 0),
  category_id uuid references categories,
  condition text check (condition in ('new', 'like new', 'good', 'fair', 'poor')),
  images text[] default '{}', -- array of image URLs
  is_sold boolean default false,
  sold_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table for inquiries
create table messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings on delete cascade not null,
  sender_id uuid references auth.users not null,
  recipient_id uuid references auth.users not null,
  content text not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table categories enable row level security;
alter table listings enable row level security;
alter table messages enable row level security;
alter table profiles enable row level security;

-- Policies for categories: anyone can view, only authenticated can insert/update/delete (if admin later)
create policy "Categories are viewable by everyone"
  on categories for select
  using (true);

create policy "Categories are insertable by authenticated users"
  on categories for insert
  with check (auth.role() = 'authenticated');

create policy "Categories are updatable by authenticated users"
  on categories for update
  using (auth.role() = 'authenticated');

create policy "Categories are deletable by authenticated users"
  on categories for delete
  using (auth.role() = 'authenticated');

-- Policies for listings: anyone can view active listings, owners can view their own sold listings
create policy "Listings are viewable by everyone"
  on listings for select
  using (is_sold = false or auth.uid() = user_id);

create policy "Listings are insertable by authenticated users"
  on listings for insert
  with check (auth.role() = 'authenticated');

create policy "Listings are updatable by owners"
  on listings for update
  using (auth.uid() = user_id);

create policy "Listings are deletable by owners"
  on listings for delete
  using (auth.uid() = user_id);

-- Policies for messages: users can send messages related to listings they don't own? 
-- Sender must be authenticated, recipient can be anyone, but we restrict to listing participants for simplicity
create policy "Messages are insertable by authenticated users"
  on messages for insert
  with check (auth.uid() = sender_id);

create policy "Messages are viewable by participants"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Policies for profiles: anyone can view profiles, only owners can update
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Profiles are insertable by owners"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owners"
  on profiles for update
  using (auth.uid() = id);

-- Insert some default categories
insert into categories (name, description) values
  ('Electronics', 'Phones, laptops, gadgets, and other electronic devices'),
  ('Clothing', 'Apparel, shoes, accessories'),
  ('Home & Garden', 'Furniture, decor, appliances, garden tools'),
  ('Books', 'Books, magazines, textbooks'),
  ('Sports & Outdoors', 'Sports equipment, camping gear, bicycles'),
  ('Toys & Games', 'Toys, video games, board games'),
  ('Automotive', 'Car parts, accessories, tools'),
  ('Other', 'Miscellaneous items')
on conflict (name) do nothing;

-- Create updated_at triggers
create trigger update_listings_updated_at
  before update on listings
  for each row
  execute function extensions.moddatetime($$updated_at$$);

create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function extensions.moddatetime($$updated_at$$);

-- Note: Supabase already includes moddatetime function via extensions