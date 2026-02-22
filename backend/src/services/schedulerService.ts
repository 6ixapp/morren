/**
 * Scheduler Service
 * Manages scheduled jobs for automated tasks
 */

import cron from 'node-cron';
import { query } from '../db';
import { fetchCardamomPricesWithRetry } from './dataGovInService';

/**
 * Seed cardamom prices on startup if the table is empty.
 */
async function seedCardamomPricesIfEmpty() {
  try {
    const countResult = await query('SELECT COUNT(*) FROM cardamom_prices');
    const count = parseInt(countResult.rows[0].count, 10);

    if (count > 0) {
      console.log(`ℹ️  Cardamom prices already seeded (${count} records), skipping initial fetch.`);
      return;
    }

    console.log('📦 Cardamom prices table is empty — fetching initial data from indianspices.com...');
    const records = await fetchCardamomPricesWithRetry(3);

    if (records.length === 0) {
      console.log('⚠️  No cardamom records returned from indianspices.com during initial seed — inserting static fallback data.');
      await insertFallbackCardamomData();
      return;
    }

    let insertedCount = 0;
    for (const record of records) {
      try {
        const minPrice = record.min_price ? parseFloat(record.min_price) : null;
        const maxPrice = record.max_price ? parseFloat(record.max_price) : null;
        const modalPrice = parseFloat(record.modal_price);
        if (isNaN(modalPrice)) continue;

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
            'indianspices.com',
          ]
        );
        if (result.rowCount && result.rowCount > 0) insertedCount++;
      } catch (err) {
        console.error('❌ [SEED] Error inserting record:', err);
      }
    }

    console.log(`✅ Initial seed complete: ${insertedCount}/${records.length} cardamom price records inserted.`);
  } catch (error) {
    console.error('❌ [SEED] Failed to seed cardamom prices:', error instanceof Error ? error.message : error);
    console.log('⚠️  Inserting static fallback cardamom data...');
    await insertFallbackCardamomData();
  }
}

/**
 * Insert static fallback cardamom price data when indianspices.com is unavailable.
 */
async function insertFallbackCardamomData() {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const d0 = fmt(today);
  const d1 = fmt(new Date(today.getTime() - 86400000));
  const d2 = fmt(new Date(today.getTime() - 2 * 86400000));

  const fallback = [
    // market, state, district, variety, min, max, modal, date
    ['Bodinayakanur', 'Tamil Nadu', 'Theni',       'Large',      1200, 1600, 1400, d0],
    ['Bodinayakanur', 'Tamil Nadu', 'Theni',       'Medium',     900,  1300, 1100, d0],
    ['Kumily',        'Kerala',     'Idukki',      'Large',      1100, 1550, 1350, d0],
    ['Kumily',        'Kerala',     'Idukki',      'Medium',     850,  1250, 1050, d0],
    ['Vandanmedu',    'Kerala',     'Idukki',      'Large',      1150, 1580, 1380, d0],
    ['Bodinayakanur', 'Tamil Nadu', 'Theni',       'Large',      1180, 1580, 1380, d1],
    ['Bodinayakanur', 'Tamil Nadu', 'Theni',       'Medium',     880,  1280, 1080, d1],
    ['Kumily',        'Kerala',     'Idukki',      'Large',      1090, 1530, 1320, d1],
    ['Bodinayakanur', 'Tamil Nadu', 'Theni',       'Large',      1160, 1560, 1360, d2],
    ['Kumily',        'Kerala',     'Idukki',      'Medium',     820,  1220, 1020, d2],
  ];

  let insertedCount = 0;
  for (const [market, state, district, variety, minP, maxP, modalP, date] of fallback) {
    try {
      const result = await query(
        `INSERT INTO cardamom_prices
         (state, district, market, variety, min_price, max_price, modal_price, arrival_date, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (market, variety, arrival_date) DO NOTHING
         RETURNING id`,
        [state, district, market, variety, minP, maxP, modalP, date, 'static-fallback']
      );
      if (result.rowCount && result.rowCount > 0) insertedCount++;
    } catch (err) {
      console.error('❌ [FALLBACK] Error inserting record:', err);
    }
  }
  console.log(`✅ [FALLBACK] Inserted ${insertedCount} static cardamom price records.`);
}

/**
 * Initialize all scheduled jobs
 */
export function initScheduledJobs() {
  console.log('⏰ Initializing scheduled jobs...');

  // Seed initial data if DB is empty
  seedCardamomPricesIfEmpty();

  // Daily cardamom price refresh - 8:00 PM IST (14:30 UTC)
  // Cron expression: minute hour day month weekday
  cron.schedule(
    '0 20 * * *',
    async () => {
      console.log('🕒 [CRON] Starting daily cardamom price refresh...');
      console.log(`📅 Timestamp: ${new Date().toISOString()}`);

      try {
        // Fetch from indianspices.com with retry logic
        const records = await fetchCardamomPricesWithRetry(3);

        if (records.length === 0) {
          console.log('⚠️  [CRON] No cardamom records found from indianspices.com');
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
                'indianspices.com',
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
    '✅ Scheduled jobs initialized: Daily cardamom price refresh at 8:00 PM IST'
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
            'indianspices.com',
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
