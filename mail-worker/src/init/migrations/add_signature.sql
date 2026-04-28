-- Migration: Add signature column to account table
-- Run with: wrangler d1 execute <your-db-name> --file=src/init/migrations/add_signature.sql
-- For local dev: add --local flag

ALTER TABLE account ADD COLUMN signature TEXT NOT NULL DEFAULT '';
