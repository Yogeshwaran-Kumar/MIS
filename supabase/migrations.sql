-- Migration Script for NDLI Club MIS Updates
-- Since your database is already created, we need to ALTER the existing tables rather than drop them.
-- Please copy this entire script and run it in the Supabase SQL Editor as you did before.

-- 1. Add new columns to the public.members table
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Update the public.events table to handle start_date and end_date
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Populate the new start_date and end_date with the existing 'date' values so we don't lose data
UPDATE public.events
SET start_date = date, end_date = date
WHERE start_date IS NULL;

-- Make the new columns required
ALTER TABLE public.events
ALTER COLUMN start_date SET NOT NULL,
ALTER COLUMN end_date SET NOT NULL;

-- Now drop the old 'date' column
ALTER TABLE public.events
DROP COLUMN IF EXISTS date;

-- Add mode column to events (Offline / Online / Hybrid)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'Offline';

-- --------------------------------------------------------
-- Phase 12 Updates (Security & Privacy Lockdown)
-- --------------------------------------------------------

-- Revoke public direct database access to member details
DROP POLICY IF EXISTS "Public read access for active members" ON public.members;
CREATE POLICY "Public read access for active members" ON public.members
    FOR SELECT USING (auth.role() = 'authenticated');

-- --------------------------------------------------------
-- Phase 13 — Fix last_active to use event's actual date
-- --------------------------------------------------------

-- Replace the trigger function: use event start_date instead of CURRENT_DATE
CREATE OR REPLACE FUNCTION update_member_aggregates()
RETURNS TRIGGER AS $$
DECLARE
    v_member_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_member_id := OLD.member_id;
    ELSE
        v_member_id := NEW.member_id;
    END IF;

    IF TG_OP = 'INSERT' THEN
        UPDATE public.members
        SET total_score         = total_score + NEW.score,
            participation_count = participation_count + 1,
            last_active         = (
                SELECT MAX(e.start_date)
                FROM public.contributions c
                JOIN public.events e ON e.id = c.event_id
                WHERE c.member_id = v_member_id
            )
        WHERE id = v_member_id;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.members
        SET total_score         = COALESCE((SELECT SUM(c.score) FROM public.contributions c WHERE c.member_id = v_member_id), 0),
            participation_count = (SELECT COUNT(*) FROM public.contributions c WHERE c.member_id = v_member_id),
            last_active         = (
                SELECT MAX(e.start_date)
                FROM public.contributions c
                JOIN public.events e ON e.id = c.event_id
                WHERE c.member_id = v_member_id
            )
        WHERE id = v_member_id;
        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.score IS DISTINCT FROM NEW.score THEN
            UPDATE public.members
            SET total_score = COALESCE((SELECT SUM(c.score) FROM public.contributions c WHERE c.member_id = v_member_id), 0),
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

-- Backfill: correct last_active for ALL existing members based on their event dates
UPDATE public.members m
SET last_active = (
    SELECT MAX(e.start_date)
    FROM public.contributions c
    JOIN public.events e ON e.id = c.event_id
    WHERE c.member_id = m.id
)
WHERE EXISTS (
    SELECT 1 FROM public.contributions c WHERE c.member_id = m.id
);
