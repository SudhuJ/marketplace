# Vapor Engine — Second-Hand Marketplace

A modern, lightweight alternative to Craigslist built with Next.js 16, React 19, and Supabase.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.2.7 (App Router, Turbopack) |
| **UI** | React 19.2.4, TypeScript 5, Tailwind CSS 4 |
| **Components** | shadcn/ui (Radix primitives) |
| **Icons** | Lucide React |
| **Data Fetching** | TanStack React Query 5 (caching, dedup, background refetch) |
| **Backend / Auth** | Supabase (PostgreSQL 17, Auth, Storage, Realtime) |
| **Realtime** | Supabase Realtime channels (instant message delivery) |
| **State** | React useState / useEffect, React Query cache |
| **Deployment** | Vercel (frontend) + Supabase Cloud (backend) |

## Features

### Authentication
- Email/password signup and login with Supabase Auth
- Session persistence with auto-refresh
- Password reset flow (forgot / update password)
- Profile auto-creation on signup (database trigger)

### Listings
- Create listings with title, description, price, category, condition, and multiple images
- Edit and delete your own listings
- Mark listings as sold / available
- Image upload to Supabase Storage (`listing-images` bucket)

### Browse & Discovery
- Responsive grid layout with listing cards
- Search by keyword (ILIKE on title)
- Filter by category and price range
- Sort by newest, price (asc/desc), and title

### Messaging
- Full real-time chat between buyers and sellers
- Supabase Realtime subscriptions — instant delivery, no polling
- Optimistic message insertion with error rollback
- Read receipts (✓ Read indicator)
- Conversation list grouped by participant + listing
- Unread message indicators

### Favorites
- Save listings to a favorites list
- View favorites on your profile page

### User Profile
- View and edit profile (full name, bio, location, website)
- Avatar upload to Supabase Storage (`avatars` bucket, upsert)
- Faceless default avatar with fallback to User icon
- Tabbed view of your listings and favorites

### Performance
- TanStack React Query for automatic caching and deduplication
- Server Components with client islands (home page)
- Loading skeletons instead of generic spinners
- Skeletal placeholders for header, filters, and listing grid
- Parallel data fetching with Promise.all
- Database indexes on all query columns
- pg_trgm extension for efficient text search

### Security
- Row Level Security (RLS) on all tables
- Messages insert policy verifies `auth.uid() = sender_id`
- Storage bucket policies scoped to owner's folder
- Typed Supabase client from generated schema types

## Database Schema

### Tables

**profiles** — Extended user info (auto-created via trigger on signup).
- `id`, `full_name`, `avatar_url`, `bio`, `location`, `website`, `created_at`, `updated_at`

**categories** — Predefined listing categories (seeded with 8 defaults).
- `id`, `name`, `description`, `created_at`

**listings** — Marketplace items.
- `id`, `user_id`, `title`, `description`, `price`, `category_id`, `condition`, `images[]`, `is_sold`, `sold_at`, timestamps

**messages** — Buyer-seller chat messages.
- `id`, `listing_id`, `sender_id`, `recipient_id`, `content`, `read_at`, `created_at`

**favorites** — Saved listings.
- `id`, `user_id`, `listing_id` (unique constraint), `created_at`

### Storage Buckets
- **`avatars`** — Public, 5 MB limit, PNG/JPEG/WebP, user-scoped folders
- **`listing-images`** — Public, 50 MB limit, PNG/JPEG/WebP

### Indexes
- `idx_listings_active_filter` — `(is_sold, category_id, price)` for browse queries
- `idx_listings_created_at` — `(created_at DESC)` for newest-first sort
- `idx_listings_user_id` — `(user_id)` for profile listings
- `idx_listings_title_trgm` — GIN trigram index for ILIKE search
- `idx_messages_participants` — `(sender_id, recipient_id)` for conversation list
- `idx_messages_conversation` — `(listing_id, sender_id, recipient_id)` for thread fetch
- `idx_favorites_user_id` — `(user_id)` for profile favorites

## Design Decisions

### Supabase (no custom backend)
All data flows client-to-Supabase directly via the typed JS client. RLS provides auth enforcement at the database level. This eliminated the need for Express/Fastify or API routes, drastically reducing build time. For production scale, an API layer would be added.

### Server Components + Client Islands
The home page is a server component shell; the interactive listing grid is a client component with React Query. This gives SSR for initial render and smaller client bundles.

### Realtime over Polling
Messages use Supabase Realtime channels instead of polling. The messages table has Realtime enabled, and the subscription listens for INSERT events filtered by `listing_id`.

### Optimistic Updates
Message sending optimistically adds the message to the UI, with automatic rollback on error. The Realtime subscription deduplicates via a `knownIds` Set.

## Assumptions Made

1. **Auth-first**: All pages redirect to login if unauthenticated. Assumes the platform is private/semi-private.
2. **Condition system**: Uses `new`, `like new`, `good`, `fair`, `poor` — standard used-goods categories.
3. **Image storage**: Supabase Storage with public buckets. In a production marketplace, images would need moderation and CDN optimization.
4. **No payment**: Money changes hands off-platform. The marketplace is a listing + connection service.
5. **No admin panel**: Moderation, reporting, and user management are not implemented.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Supabase account (local or cloud)

### Local Development

```bash
pnpm install
cp .env.local.example .env.local  # Add your Supabase URL + anon key
pnpm dev                           # Starts on http://localhost:3000
```

### Apply Migrations

```bash
pnpm supabase link --project-ref <your-project-ref>
pnpm supabase db push
```

Or run the SQL files in `supabase/migrations/` manually in the Supabase SQL editor.

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

- **Frontend**: Deploy the Next.js app to Vercel. Set the two env vars in the Vercel dashboard.
- **Backend**: Create a Supabase project, run the migrations, note the URL and anon key.

## License

MIT
