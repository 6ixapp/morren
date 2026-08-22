/**
 * Scheduler Service
 * Manages scheduled jobs for automated tasks
 */

import cron from 'node-cron';
import { query } from '../db';
import { fetchCardamomPricesWithRetry } from './dataGovInService';
import { closeExpiredOrderAuctions } from './whatsappAuctionService';
import { deleteExpiredCardamomRecords, persistCardamomRecords } from './cardamomPersistence';

// Prevent duplicate cron work when the backend is later run in cluster mode.
async function withAdvisoryJobLock(lockKey: number, job: () => Promise<void>): Promise<boolean> {
  const lockResult = await query('SELECT pg_try_advisory_lock($1) AS locked', [lockKey]);
  if (!lockResult.rows[0]?.locked) return false;

  try {
    await job();
    return true;
  } finally {
    await query('SELECT pg_advisory_unlock($1)', [lockKey]);
  }
}

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

    const summary = await persistCardamomRecords(records);

    console.log(`✅ Initial seed complete: ${summary.inserted}/${records.length} cardamom price records inserted.`);
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

  const fallbackRecords = fallback.map(([market, state, district, variety, minP, maxP, modalP, date]) => ({
    market: String(market),
    state: String(state),
    district: String(district),
    variety: String(variety),
    min_price: String(minP),
    max_price: String(maxP),
    modal_price: String(modalP),
    arrival_date: String(date),
    commodity: 'cardamom',
  }));
  const summary = await persistCardamomRecords(fallbackRecords, 'static-fallback');
  console.log(`✅ [FALLBACK] Inserted ${summary.inserted} static cardamom price records.`);
}

/**
 * Initialize all scheduled jobs
 */
export function initScheduledJobs() {
  console.log('⏰ Initializing scheduled jobs...');

  // Seed initial data if DB is empty
  void withAdvisoryJobLock(73001, seedCardamomPricesIfEmpty).catch((error) => {
    console.error('❌ Failed to acquire cardamom seed lock:', error);
  });

  // Daily cardamom price refresh - 8:00 PM IST (14:30 UTC)
  // Cron expression: minute hour day month weekday
  cron.schedule(
    '0 20 * * *',
    async () => {
      const acquired = await withAdvisoryJobLock(73002, async () => {
        console.log('🕒 [CRON] Starting daily cardamom price refresh...');
        console.log(`📅 Timestamp: ${new Date().toISOString()}`);

        try {
        // Fetch from indianspices.com with retry logic
        const records = await fetchCardamomPricesWithRetry(3);

        if (records.length === 0) {
          console.log('⚠️  [CRON] No cardamom records found from indianspices.com');
          return;
        }

        const summary = await persistCardamomRecords(records);
        const deletedCount = await deleteExpiredCardamomRecords();

        console.log(`✅ [CRON] Cardamom prices refreshed successfully:`);
        console.log(`   📥 Fetched: ${records.length} records`);
        console.log(`   ✨ Inserted: ${summary.inserted} new records`);
        console.log(`   ⏭️  Skipped: ${summary.skipped + summary.invalid} duplicates/invalid`);
        console.log(`   🗑️  Deleted: ${deletedCount} old records (>7 days)`);
        } catch (error) {
          console.error('❌ [CRON] Failed to refresh cardamom prices:', error);
          console.error(
            'Error details:',
            error instanceof Error ? error.message : error
          );
        }
      });

      if (!acquired) console.log('ℹ️ [CRON] Cardamom refresh already running in another instance.');
    },
    {
      timezone: 'Asia/Kolkata', // Indian Standard Time
    }
  );

  // Close expired WhatsApp auctions every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    const acquired = await withAdvisoryJobLock(73003, async () => {
      try {
        const result = await closeExpiredOrderAuctions();
        if (result.closedAuctionCount > 0) {
          console.log(`✅ [CRON] Closed ${result.closedAuctionCount} auctions and sent ${result.notifiedCount} notifications`);
        }
      } catch (error) {
        console.error('❌ [CRON] Failed to close expired WhatsApp auctions:', error);
      }
    });
    if (!acquired) console.log('ℹ️ [CRON] Auction close already running in another instance.');
  });

  console.log(
    '✅ Scheduled jobs initialized: Cardamom refresh + WhatsApp auction close jobs'
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

    const summary = await persistCardamomRecords(records);
    const deletedCount = await deleteExpiredCardamomRecords();

    console.log(`✅ Test refresh complete: ${summary.inserted} inserted, ${deletedCount} deleted`);
  } catch (error) {
    console.error('❌ Test refresh failed:', error);
  }
}
