# LocalFlow

> Internal social media & reputation management dashboard for local businesses.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Database | Supabase PostgreSQL |
| ORM | Prisma |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | OpenAI API (GPT-4o mini) |
| Jobs | Trigger.dev |
| Deployment | Vercel |

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local` — especially:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` + `DIRECT_URL`
- `OPENAI_API_KEY`

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the project URL and anon key to `.env.local`
3. In Supabase Dashboard → Storage, create a bucket called **`media`** (set to public)
4. Copy the database URLs from Settings → Database → Connection string

### 4. Push the database schema

```bash
npm run db:push
```

Or for a migration-based workflow:

```bash
npm run db:migrate
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup pages
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── dashboard/       # Home overview
│   │   ├── compose/         # Content composer
│   │   ├── calendar/        # Content calendar
│   │   ├── inbox/           # Unified inbox
│   │   ├── media/           # Media library
│   │   └── settings/        # Workspace & integrations
│   ├── actions/             # Server Actions (auth)
│   └── api/                 # API routes
│       ├── ai/              # Caption, hashtags, reply generation
│       ├── posts/           # CRUD for posts
│       ├── inbox/           # Inbox management
│       ├── media/           # File uploads
│       ├── businesses/      # Business management
│       └── workspaces/      # Workspace settings
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── auth/                # Login/signup forms
│   ├── layout/              # Sidebar, topbar
│   ├── dashboard/           # Stats cards, activity feed
│   ├── composer/            # Post composer
│   ├── calendar/            # Content calendar
│   ├── inbox/               # Unified inbox
│   ├── media/               # Media library
│   └── settings/            # Settings panels
├── lib/
│   ├── supabase/            # Client, server, middleware helpers
│   ├── prisma.ts            # Prisma singleton
│   ├── openai.ts            # OpenAI client singleton
│   └── utils.ts             # Utility functions
├── services/
│   ├── ai.service.ts        # AI generation (caption, hashtags, reply)
│   └── integrations/        # Provider abstraction layer
│       ├── provider.interface.ts
│       ├── provider.factory.ts
│       ├── facebook.provider.ts
│       ├── instagram.provider.ts
│       └── google-business.provider.ts
├── trigger/
│   └── publish-post.ts      # Scheduled publishing job
└── types/
    └── index.ts             # Shared TypeScript types
prisma/
└── schema.prisma            # Database schema
```

---

## Core Features

### Authentication
- Email/password login & signup via Supabase Auth
- Workspace created automatically on signup
- Protected routes via middleware

### Workspace System
- Multi-business support per workspace
- Multi-location per business
- Brand tone and language per business

### Content Composer
- Supports: Single image, carousel, reel, video, text, Google update
- AI-generated captions (respects brand tone)
- AI-generated hashtags
- Platform targeting (select which accounts to publish to)
- Schedule date/time or publish immediately

### Content Calendar
- Monthly calendar view with color-coded post statuses
- Weekly mode
- One-click "New Post" shortcut

### Unified Inbox
- Lists reviews and comments from all connected platforms
- Sentiment indicator (positive / neutral / negative)
- AI-generated suggested reply
- Mark as resolved workflow

### Media Library
- Upload images and videos to Supabase Storage
- Grid and list views
- File type filtering
- Batch select

### AI Assistant (OpenAI)
- Caption generation with brand tone
- Hashtag generation from caption
- Review reply generation (tone-aware, multilingual)
- All usage logged to `ai_usage_logs`

### Provider Integration Layer
- Facebook Pages — publish posts, sync inbox
- Instagram Business — single image, carousel, reels
- Google Business Profile — local posts, review sync
- TikTok — placeholder only (planned)

### Background Jobs (Trigger.dev)
- Cron job every 5 minutes to publish scheduled posts
- Updates post status after publish attempt

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy — Next.js 15 is natively supported

For Trigger.dev jobs, deploy separately via their CLI:

```bash
npx trigger.dev@latest deploy
```

---

## Roadmap

- [ ] OAuth flows for Facebook, Instagram, Google
- [ ] Real-time inbox sync via webhooks
- [ ] Analytics charts (engagement, reach, sentiment trends)
- [ ] Team member management
- [ ] TikTok integration
- [ ] Mobile-responsive improvements
- [ ] Dark mode polish
