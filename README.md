# Vapor Engine - Second-Hand Marketplace

A modern, lightweight alternative to Craigslist built with Next.js and Supabase.

## Features Implemented

### Core Features
- **Authentication**: User signup/login with email/password using Supabase Auth
- **Listings**: 
  - Create listings with title, description, price, category, condition, and images
  - Edit and delete your own listings
  - Mark listings as sold/available
  - Browse all active listings
- **Discovery**:
  - Filter by category
  - Search by keyword
  - Filter by price range
- **User Profile**: View your own listings (implicit through edit/delete controls)
- **Seller Interaction**: Inquiry system placeholder (ready for expansion)

### Technical Implementation
- **Frontend**: Next.js 16.2.7 with React 19.2.4, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL) for authentication and data storage
- **Deployment**: Designed for Vercel (frontend) and Supabase (backend)

## Database Schema

The application uses these core tables:

1. **categories** - Predefined categories for listings
2. **listings** - Main marketplace items with fields for:
   - Basic info (title, description, price)
   - Ownership (user_id)
   - Categorization (category_id)
   - Condition and status (is_sold)
   - Media (images array)
   - Timestamps
3. **messages** - For buyer-seller inquiries (placeholder implementation)
4. **profiles** - Extended user information

Row Level Security (RLS) policies ensure users can only modify their own data.

## Assumptions Made

1. **Authentication**: Used email/password auth with email confirmation (standard Supabase flow)
2. **Image Handling**: For simplicity, images are stored as base64 strings in arrays. In production, this would use Supabase Storage.
3. **Messaging**: The inquiry system is currently a placeholder alert. Full implementation would require a real-time messaging system.
4. **Local Development**: Assumes Docker is available for Supabase local development.
5. **Deployment**: Optimized for free-tier deployment on Vercel + Supabase.
6. **Data Validation**: Basic client-side validation with server-side validation through Supabase constraints.
7. **Condition System**: Used standard condition categories (new, like new, good, fair, poor).

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm
- Docker (for local Supabase development)
- Supabase account

### Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

3. Start Supabase locally:
   ```bash
   pnpm supabase start
   ```

4. Run database migrations:
   ```bash
   pnpm supabase db push
   ```

5. Start the Next.js development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Environment Variables
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project on Vercel
3. Set environment variables in Vercel dashboard

### Backend (Supabase)
1. Create a new Supabase project
2. Run the SQL migration in the Supabase SQL editor
3. Get your URL and anon key from Supabase settings
4. Add these to your Vercel environment variables

## Future Improvements

1. **Image Upload**: Integrate Supabase Storage for proper image handling
2. **Real-time Messaging**: Implement actual buyer-seller communication
3. **User Profiles**: Detailed profile pages with avatar, bio, etc.
4. **Advanced Search**: Saved searches, search history
5. **Payment Integration**: For facilitated transactions
6. **Admin Dashboard**: For platform management
7. **Location-Based Features**: Distance filtering, local pickup options
8. **Saved Listings**: Wishlist/favorites functionality
9. **Reports & Analytics**: For sellers to track performance
10. **Moderation System**: For reporting inappropriate content

## License

MIT