-- Migration: Create cardamom_prices table for data.gov.in integration
-- Purpose: Store daily cardamom market prices with 7-day retention
-- Date: 2026-02-21

-- Create cardamom_prices table
CREATE TABLE IF NOT EXISTS cardamom_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location information
  state VARCHAR(100),
  district VARCHAR(100),
  market VARCHAR(255) NOT NULL,

  -- Product details
  variety VARCHAR(50) NOT NULL,  -- e.g., "8mm", "9MM", "7-8MM"

  -- Pricing information
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  modal_price DECIMAL(10, 2) NOT NULL,  -- Most common/representative price

  -- Metadata
  arrival_date DATE NOT NULL,
  source VARCHAR(50) DEFAULT 'data.gov.in',

  -- Timestamps
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cardamom_prices_variety
  ON cardamom_prices(variety);

CREATE INDEX IF NOT EXISTS idx_cardamom_prices_market
  ON cardamom_prices(market);

CREATE INDEX IF NOT EXISTS idx_cardamom_prices_arrival_date
  ON cardamom_prices(arrival_date DESC);

CREATE INDEX IF NOT EXISTS idx_cardamom_prices_created_at
  ON cardamom_prices(created_at DESC);

-- Composite index for common queries (variety + date filtering)
CREATE INDEX IF NOT EXISTS idx_cardamom_prices_variety_date
  ON cardamom_prices(variety, arrival_date DESC);

-- Add unique constraint to prevent duplicate entries
-- Same market, variety, and arrival date should be unique
ALTER TABLE cardamom_prices
  DROP CONSTRAINT IF EXISTS unique_cardamom_entry;

ALTER TABLE cardamom_prices
  ADD CONSTRAINT unique_cardamom_entry
  UNIQUE (market, variety, arrival_date);

-- Comment on table and important columns
COMMENT ON TABLE cardamom_prices IS
  'Stores daily cardamom market prices fetched from data.gov.in API. Auto-cleanup after 7 days.';

COMMENT ON COLUMN cardamom_prices.modal_price IS
  'Most common or representative price for the day (primary price indicator)';

COMMENT ON COLUMN cardamom_prices.source IS
  'Data source identifier (default: data.gov.in)';

COMMENT ON COLUMN cardamom_prices.arrival_date IS
  'Date when the commodity arrived at the market (from API data)';
