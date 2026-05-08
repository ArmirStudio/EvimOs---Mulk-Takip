-- ============================================================
-- Migration: invites tablosuna employee rolü ekle
-- Date: 2026-05-07
-- ============================================================

ALTER TABLE public.invites
  DROP CONSTRAINT IF EXISTS invites_role_check;

ALTER TABLE public.invites
  ADD CONSTRAINT invites_role_check
    CHECK (role IN ('tenant', 'landlord', 'employee'));

-- ============================================================
-- DONE
-- ============================================================
