-- Add role and extended medical info columns to the 'profiles' table
-- This allows role-based access control and better tracking of patient history.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
ADD COLUMN IF NOT EXISTS severity_stage text DEFAULT 'Intermittent',
ADD COLUMN IF NOT EXISTS daily_triggers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS daily_medications jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS prior_exacerbations integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS peak_flow_baseline integer;

-- Update Row Level Security Policies for the profiles table to ensure patients can only edit their own, while doctors could potentially view assigned patients

-- Assuming a basic policy exists, ensure users can read their own profiles, 
-- but also allow 'doctor' roles to view all profiles for simplicity in this implementation phase.
-- Note: A real HIPAA system requires explicit doctor-patient assignment table.
CREATE POLICY "Doctors can view all patient profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'doctor'
  )
);
