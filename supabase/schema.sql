-- Enable the UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: members
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sec_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT,
    section TEXT,
    year INT CHECK (year >= 1 AND year <= 4),
    batch TEXT NOT NULL, -- e.g., '2022-2026'
    email TEXT,
    phone TEXT,
    total_score INT DEFAULT 0,
    participation_count INT DEFAULT 0,
    last_active DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ex-member')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT, -- Event, Activity, Program, Report, Meeting
    mode TEXT DEFAULT 'Offline',
    description TEXT,
    poster_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: contributions
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    work_description TEXT,
    score INT DEFAULT 0 CHECK (score >= 0 AND score <= 10),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_id, event_id) -- Prevent duplicate entries for the same event per member
);

-- Indexes for performance
CREATE INDEX idx_members_sec_id ON public.members (sec_id);
CREATE INDEX idx_members_batch ON public.members (batch);
CREATE INDEX idx_members_status ON public.members (status);
CREATE INDEX idx_members_total_score ON public.members (total_score ASC);
CREATE INDEX idx_contributions_member_id ON public.contributions (member_id);
CREATE INDEX idx_contributions_event_id ON public.contributions (event_id);
CREATE INDEX idx_events_date ON public.events (date DESC);

-- Trigger function to update member aggregates
CREATE OR REPLACE FUNCTION update_member_aggregates()
RETURNS TRIGGER AS $$
DECLARE
    v_member_id UUID;
BEGIN
    -- Determine which member is affected
    IF TG_OP = 'DELETE' THEN
        v_member_id := OLD.member_id;
    ELSE
        v_member_id := NEW.member_id;
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- Increment score/count, set last_active to the event's actual date
        UPDATE public.members
        SET total_score        = total_score + NEW.score,
            participation_count = participation_count + 1,
            last_active        = (
                SELECT MAX(e.start_date)
                FROM public.contributions c
                JOIN public.events e ON e.id = c.event_id
                WHERE c.member_id = v_member_id
            )
        WHERE id = v_member_id;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        -- Fully recalculate all aggregates from remaining contributions
        UPDATE public.members
        SET total_score        = COALESCE((
                SELECT SUM(c.score) FROM public.contributions c WHERE c.member_id = v_member_id
            ), 0),
            participation_count = (
                SELECT COUNT(*) FROM public.contributions c WHERE c.member_id = v_member_id
            ),
            last_active        = (
                SELECT MAX(e.start_date)
                FROM public.contributions c
                JOIN public.events e ON e.id = c.event_id
                WHERE c.member_id = v_member_id
            )
        WHERE id = v_member_id;
        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Only recalculate if the score changed
        IF OLD.score IS DISTINCT FROM NEW.score THEN
            UPDATE public.members
            SET total_score = COALESCE((
                    SELECT SUM(c.score) FROM public.contributions c WHERE c.member_id = v_member_id
                ), 0),
                last_active = (
                    SELECT MAX(e.start_date)
                    FROM public.contributions c
                    JOIN public.events e ON e.id = c.event_id
                    WHERE c.member_id = v_member_id
                )
            WHERE id = v_member_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contributions
DROP TRIGGER IF EXISTS trg_update_member_aggregates ON public.contributions;
CREATE TRIGGER trg_update_member_aggregates
AFTER INSERT OR UPDATE OR DELETE ON public.contributions
FOR EACH ROW EXECUTE FUNCTION update_member_aggregates();

-- Row Level Security (RLS)

-- 1. members RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for active members" ON public.members
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write access for members" ON public.members
    FOR ALL USING (auth.role() = 'authenticated'); -- Assuming only admins are logged in

-- 2. events RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for events" ON public.events
    FOR SELECT USING (true);
CREATE POLICY "Admin write access for events" ON public.events
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. contributions RLS
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for contributions" ON public.contributions
    FOR SELECT USING (true);
CREATE POLICY "Admin write access for contributions" ON public.contributions
    FOR ALL USING (auth.role() = 'authenticated');

-- Function to check if user is admin based on auth.email() matching environment variables/config
-- For simplicity, since anyone authenticated is assumed to be an admin (no public signups allowed),
-- the policies above check `auth.role() = 'authenticated'`. Disable signup in Supabase dashboard.
