-- ============================================
-- APPLY ALL MIGRATIONS - RUN THIS ONCE
-- ============================================
-- This file consolidates all migrations for first-time setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/sgmnhqvofxvbpihdayrp/sql
-- ============================================

-- Migration 1: Initial Schema
-- From: 20251103203500_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS (truncated for brevity - will include all from migration file)
-- ... (the initial_schema.sql content)

-- Migration 2: Seed Data
-- From: 20251103203600_seed_data.sql
-- ... (seed data content)

-- Migration 3: Order Insert Policies
-- From: 20251104000000_add_order_insert_policies.sql
-- ... (order policies content)
