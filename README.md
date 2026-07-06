# Club — Management Information System (MIS)

A premium, production-grade administrative tool for NDLI Clubs to manage members, events, and volunteer contributions with ease.

## 🚀 Key Features

- **Smart Suggest & Auto-Allocate**: Automatically distribute members into "Volunteer" and "Participant" roles based on historical contribution scores.
- **Contribution Manager**: A high-density, context-aware interface for recording event involvement.
- **Live Dashboard**: Real-time statistics on member participation, role distribution, and top contributors.
- **Member Portfolios**: Detailed activity logs and contribution history for every member, sorted chronologically.
- **Reporting**: Export professional, role-sorted Excel reports including event dates and calibrated points.
- **Security-First**: Sensitive PII and scoring data are restricted to admin-only views with secure server-side fetching.

## 🛠️ Technology Stack

- **Framework**: Next.js 15+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS & Shadcn UI
- **Data Export**: XLSX (Excel generation)
- **Icons**: Lucide React

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+
- Supabase Account

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file with the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_CLUB_NAME="NDLI Club"
NEXT_PUBLIC_COLLEGE_NAME="Your College Name"
```

### 4. Database Schema
Apply the SQL schema found in `supabase/schema.sql` via the Supabase SQL Editor.

### 5. Run Locally
```bash
npm run dev
```

## 📄 License
Internal use only. Developed for Sri Sairam Engineering College NDLI Club.
