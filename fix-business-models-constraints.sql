-- Migration script to fix business model database constraints
-- Run this in your Supabase SQL Editor to add missing unique constraints

-- Add unique constraint to revenue_models table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'revenue_models_business_idea_unique'
        AND table_name = 'revenue_models'
    ) THEN
        ALTER TABLE revenue_models 
        ADD CONSTRAINT revenue_models_business_idea_unique UNIQUE (business_idea_id);
    END IF;
END $$;

-- Add unique constraint to advanced_business_models table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'advanced_models_business_idea_unique'
        AND table_name = 'advanced_business_models'
    ) THEN
        ALTER TABLE advanced_business_models 
        ADD CONSTRAINT advanced_models_business_idea_unique UNIQUE (business_idea_id);
    END IF;
END $$;

-- Verify constraints were added
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('revenue_models', 'advanced_business_models')
AND constraint_type = 'UNIQUE'
ORDER BY table_name, constraint_name; 