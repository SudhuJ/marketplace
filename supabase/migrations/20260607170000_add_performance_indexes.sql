-- Enable pg_trgm for efficient ILIKE / full-text search on listing titles
create extension if not exists pg_trgm;

-- Listings: speed up the main browse query (is_sold + category + price)
create index concurrently if not exists idx_listings_active_filter
  on listings (is_sold, category_id, price);

-- Listings: speed up "newest first" sorting
create index concurrently if not exists idx_listings_created_at
  on listings (created_at desc);

-- Listings: speed up profile / "my listings" queries
create index concurrently if not exists idx_listings_user_id
  on listings (user_id);

-- Listings: speed up keyword search via ILIKE
create index concurrently if not exists idx_listings_title_trgm
  on listings using gin (title gin_trgm_ops);

-- Messages: speed up finding conversations by participant
create index concurrently if not exists idx_messages_participants
  on messages (sender_id, recipient_id);

-- Messages: speed up fetching a conversation thread (listing + both users)
create index concurrently if not exists idx_messages_conversation
  on messages (listing_id, sender_id, recipient_id);

-- Favorites: speed up "my favorites" queries (unique index already covers user_id scans)
create index concurrently if not exists idx_favorites_user_id
  on favorites (user_id);
