# ClubMIS — Setup Guide

Welcome! This guide sets up the Club Management Information System (MIS) for your institution in under 30 minutes.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, name it `[Your Club] MIS`, and choose the region closest to you (e.g., Mumbai for India).
3. Wait a few minutes for the database to provision.

## 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```env
# ── Supabase (required) ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# ── White-label branding (edit for your club) ─────────────────
NEXT_PUBLIC_CLUB_NAME=NDLI Club
NEXT_PUBLIC_CLUB_SHORT_NAME=NDLI
NEXT_PUBLIC_COLLEGE_NAME=Sri Sairam Engineering College
NEXT_PUBLIC_LOGO_PATH=/ndli-logo-nbg.png
NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN=srisairam.edu.in

# ── Optional ───────────────────────────────────────────────────
# Set to 'false' to hide the "Powered by ClubMIS" footer text
NEXT_PUBLIC_SHOW_POWERED_BY=true
NEXT_PUBLIC_SUPPORT_EMAIL=
```

**Where to get Supabase keys:**  
Dashboard → Settings (gear icon) → API → Project URL + anon key + service_role secret key.

## 3. Set Up the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard.
2. Click **New query**, open `supabase/schema.sql`, paste all contents, and click **Run**.  
   *(Creates all tables, auto-score triggers, and row security policies.)*

## 4. Create Your Admin Account

1. Go to **Authentication** → **Users** → **Add User** → **Create new user**.
2. Enter your admin email and a secure password. Enable **Auto Confirm User**.
3. This email + password is what you use to log into `/admin/login`.

> **Tip:** Go to Authentication → Providers → Email and disable "Confirm email" and "Enable Signup" to prevent public registrations.

## 5. Start the Application

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Navigate to `/admin/login`, sign in, and upload your first member Excel file.

## 6. Deploy to Vercel (Production)

1. Push this repo to GitHub.
2. Import it in [vercel.com](https://vercel.com).
3. In Vercel Project Settings → Environment Variables, add all variables from `.env.local`.
4. Deploy — done! Your club MIS is live on a custom domain.

---

> **Logo:** Replace `/public/ndli-logo-nbg.png` with your club logo and update `NEXT_PUBLIC_LOGO_PATH` accordingly.
