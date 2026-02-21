/**
 * Scheduler Service
 * Manages scheduled jobs for automated tasks
 */

import cron from 'node-cron';
import { query } from '../db';
import { fetchCardamomPricesWithRetry } from './dataGovInService';

/**
 * Initialize all scheduled jobs
 */
export function initScheduledJobs() {
  console.log('⏰ Initializing scheduled jobs...');

  // Daily cardamom price refresh - 6:00 AM IST (00:30 UTC)
  // Cron expression: minute hour day month weekday
  cron.schedule(
    '0 6 * * *',
    async () => {
      console.log('🕒 [CRON] Starting daily cardamom price refresh...');
      console.log(`📅 Timestamp: ${new Date().toISOString()}`);

      try {
        // Fetch from data.gov.in with retry logic
        const records = await fetchCardamomPricesWithRetry(3);

        if (records.length === 0) {
          console.log('⚠️  [CRON] No cardamom records found from data.gov.in');
          return;
        }

        let insertedCount = 0;
        let skippedCount = 0;

        for (const record of records) {
          try {
            // Parse prices, handling potential null/undefined values
            const minPrice = record.min_price
              ? parseFloat(record.min_price)
              : null;
            const maxPrice = record.max_price
              ? parseFloat(record.max_price)
              : null;
            const modalPrice = parseFloat(record.modal_price);

            // Skip if modal price is invalid
            if (isNaN(modalPrice)) {
              skippedCount++;
              continue;
            }

            const result = await query(
              `INSERT INTO cardamom_prices
               (state, district, market, variety, min_price, max_price, modal_price, arrival_date, source)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (market, variety, arrival_date) DO NOTHING
               RETURNING id`,
              [
                record.state || null,
                record.district || null,
                record.market,
                record.variety || 'Unknown',
                minPrice,
                maxPrice,
                modalPrice,
                record.arrival_date,
                'data.gov.in',
              ]
            );

            // Count only actually inserted records (not conflicts)
            if (result.rowCount && result.rowCount > 0) {
              insertedCount++;
            } else {
              skippedCount++;
            }
          } catch (err) {
            console.error(`❌ [CRON] Error inserting record:`, err);
            skippedCount++;
          }
        }

        // Cleanup old records (7-day retention)
        const deleteResult = await query(
          `DELETE FROM cardamom_prices
           WHERE arrival_date < CURRENT_DATE - INTERVAL '7 days'
           RETURNING id`
        );

        const deletedCount = deleteResult.rowCount || 0;

        console.log(`✅ [CRON] Cardamom prices refreshed successfully:`);
        console.log(`   📥 Fetched: ${records.length} records`);
        console.log(`   ✨ Inserted: ${insertedCount} new records`);
        console.log(`   ⏭️  Skipped: ${skippedCount} duplicates/invalid`);
        console.log(`   🗑️  Deleted: ${deletedCount} old records (>7 days)`);
      } catch (error) {
        console.error('❌ [CRON] Failed to refresh cardamom prices:', error);
        console.error(
          'Error details:',
          error instanceof Error ? error.message : error
        );
      }
    },
    {
      timezone: 'Asia/Kolkata', // Indian Standard Time
    }
  );

  console.log(
    '✅ Scheduled jobs initialized: Daily cardamom price refresh at 6:00 AM IST'
  );
}

/**
 * Test function to run cardamom price refresh immediately (for debugging)
 * DO NOT call this in production - use only for manual testing
 */
export async function runCardamomRefreshNow() {
  console.log('🧪 [TEST] Running immediate cardamom price refresh...');

  try {
    const records = await fetchCardamomPricesWithRetry(3);
    console.log(`Fetched ${records.length} records`);

    let insertedCount = 0;

    for (const record of records) {
      try {
        const minPrice = record.min_price ? parseFloat(record.min_price) : null;
        const maxPrice = record.max_price ? parseFloat(record.max_price) : null;
        const modalPrice = parseFloat(record.modal_price);

        if (isNaN(modalPrice)) continue;

        await query(
          `INSERT INTO cardamom_prices
           (state, district, market, variety, min_price, max_price, modal_price, arrival_date, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (market, variety, arrival_date) DO NOTHING`,
          [
            record.state || null,
            record.district || null,
            record.market,
            record.variety || 'Unknown',
            minPrice,
            maxPrice,
            modalPrice,
            record.arrival_date,
            'data.gov.in',
          ]
        );
        insertedCount++;
      } catch (err) {
        console.error('Error inserting:', err);
      }
    }

    const deleteResult = await query(
      `DELETE FROM cardamom_prices
       WHERE arrival_date < CURRENT_DATE - INTERVAL '7 days'`
    );

    console.log(`✅ Test refresh complete: ${insertedCount} inserted, ${deleteResult.rowCount} deleted`);
  } catch (error) {
    console.error('❌ Test refresh failed:', error);
  }
}
