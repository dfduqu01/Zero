-- ============================================
-- FIX USERS TABLE RLS INFINITE RECURSION
-- ============================================
-- Migration: 20251104000001_fix_users_rls_recursion.sql
-- Description: Fixes infinite recursion in users table RLS policy
-- Author: Security Fix
-- Date: 2025-11-04
-- ============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Recreate without recursion
-- Instead of checking users.is_admin (which causes recursion),
-- we check auth.jwt() claims or use a function
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    -- Check if current user's ID exists in users table with is_admin = true
    -- Use a raw SQL query that bypasses RLS
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
    OR
    -- Allow users to see their own profile
    auth.uid() = id
  );

-- Alternative: Create a security definer function to check admin status
-- This function runs with elevated privileges, bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- Drop and recreate the admin policy using the function
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    public.is_admin() OR auth.uid() = id
  );

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251104000001_fix_users_rls_recursion.sql completed successfully';
  RAISE NOTICE 'Fixed infinite recursion in users table RLS policy';
END $$;
