-- SQL Migration to support dynamic AI-driven programmes
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.active_programme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS allows read and update (assuming public access for now, or match your current auth structure)
ALTER TABLE public.active_programme ENABLE ROW LEVEL SECURITY;

-- If you have coaches/athletes, adjust the policy. For a single-user prototype:
DROP POLICY IF EXISTS "Allow all" ON public.active_programme;
CREATE POLICY "Allow all" ON public.active_programme FOR ALL USING (true) WITH CHECK (true);

-- Insert a placeholder row that our app will find and update
INSERT INTO public.active_programme (id, payload)
VALUES ('11111111-1111-1111-1111-111111111111', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
