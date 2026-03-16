-- Migration: Drop status column from classes table
-- This removes the class completion tracking system in favor of automatic monthly progression
-- The status column was previously used for: 'active', 'completed', 'upgraded', 'cancelled'

ALTER TABLE classes DROP COLUMN IF EXISTS status;
